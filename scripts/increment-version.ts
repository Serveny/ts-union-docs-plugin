#!/usr/bin/env node

const fs = require('node:fs') as typeof import('node:fs');
const path = require('node:path') as typeof import('node:path');
const { execFileSync } = require('node:child_process') as typeof import('node:child_process');
const readline = require('node:readline/promises') as typeof import('node:readline/promises');
const { stdin, stdout } = require('node:process') as typeof import('node:process');

type ReleaseType = 'major' | 'minor' | 'patch';
type ChangelogCategory = 'Documentation' | 'Maintenance' | 'Tests' | 'Fixed' | 'Added' | 'Improved' | 'Changed';
type JsonObject = Record<string, unknown>;

type PackageJson = JsonObject & {
    version: string;
};

type PackageLockPackage = JsonObject & {
    version?: string;
};

type PackageLock = JsonObject & {
    version: string;
    packages?: Record<string, PackageLockPackage>;
};

type GitLogEntry = {
    hash: string;
    subject: string;
};

const repoRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(repoRoot, 'package.json');
const packageLockPath = path.join(repoRoot, 'package-lock.json');
const changelogPath = path.join(repoRoot, 'CHANGELOG.md');

function isJsonObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null;
}

function assertJsonObject(value: unknown, label: string): asserts value is JsonObject {
    if (!isJsonObject(value)) {
        throw new Error(`${label} muss ein JSON-Objekt sein`);
    }
}

function readJson(filePath: string): unknown {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parsePackageJson(value: unknown): PackageJson {
    assertJsonObject(value, 'package.json');

    if (typeof value['version'] !== 'string') {
        throw new Error('package.json.version muss ein String sein');
    }

    return value as PackageJson;
}

function parsePackageLock(value: unknown): PackageLock {
    assertJsonObject(value, 'package-lock.json');

    if (typeof value['version'] !== 'string') {
        throw new Error('package-lock.json.version muss ein String sein');
    }

    if (value['packages'] !== undefined) {
        assertJsonObject(value['packages'], 'package-lock.json.packages');

        for (const [packageName, packageValue] of Object.entries(value['packages'])) {
            assertJsonObject(packageValue, `package-lock.json.packages[${packageName}]`);
        }
    }

    return value as PackageLock;
}

function writeJson(filePath: string, value: unknown): void {
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 4)}\n`);
}

function runGit(args: string[]): string {
    return execFileSync('git', args, {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
}

function bumpVersion(version: string, releaseType: ReleaseType): string {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);

    if (!match) {
        throw new Error(`Ungueltige SemVer-Version in package.json: ${version}`);
    }

    const major = Number(match[1]);
    const minor = Number(match[2]);
    const patch = Number(match[3]);

    switch (releaseType) {
        case 'major':
            return `${major + 1}.0.0`;
        case 'minor':
            return `${major}.${minor + 1}.0`;
        case 'patch':
            return `${major}.${minor}.${patch + 1}`;
    }
}

function parseGitLog(output: string): GitLogEntry[] {
    if (!output) {
        return [];
    }

    return output
        .split('\n')
        .filter(Boolean)
        .map((line) => {
            const [hash = '', subject = ''] = line.split('\t');
            return { hash, subject: subject.trim() };
        });
}

function isVersionSubject(subject: string): boolean {
    return /^v?\d+\.\d+\.\d+$/.test(subject);
}

function findLastReleaseRef(currentVersion: string): string | null {
    const history = parseGitLog(runGit(['log', '--format=%H%x09%s']));
    const expectedSubjects = new Set([currentVersion, `v${currentVersion}`]);

    const matchingCurrentRelease = history.find(({ subject }) => expectedSubjects.has(subject));
    if (matchingCurrentRelease) {
        return matchingCurrentRelease.hash;
    }

    const latestRelease = history.find(({ subject }) => isVersionSubject(subject));
    return latestRelease ? latestRelease.hash : null;
}

function cleanCommitMessage(subject: string): string {
    return subject
        .replace(/^(\[[A-Z]+\]\s*)+/i, '')
        .replace(/^(feat|fix|refactor|chore|docs|test|tests|build|ci|perf|style)(\([^)]+\))?:\s*/i, '')
        .replace(/^added feat:\s*/i, 'Added ')
        .replace(/\s*;+\s*/g, '; ')
        .replace(/\s+/g, ' ')
        .replace(/\.$/, '')
        .trim();
}

function classifyCommit(subject: string): ChangelogCategory {
    const lower = subject.toLowerCase();

    if (/\b(doc|readme|changelog)\b/.test(lower)) {
        return 'Documentation';
    }

    if (/\b(ci|workflow|github action|release|publish|build)\b/.test(lower)) {
        return 'Maintenance';
    }

    if (/\btest/.test(lower)) {
        return 'Tests';
    }

    if (/\bfix(ed)?\b|\[fix\]/.test(lower)) {
        return 'Fixed';
    }

    if (/\b(add|added|feat|feature|support)\b/.test(lower)) {
        return 'Added';
    }

    if (/\b(refactor|improv|improved|update|updated|bump|deps|dependency|perf|enhance|missing version)\b/.test(lower)) {
        return 'Improved';
    }

    return 'Changed';
}

function formatChangelogLine(subject: string): string {
    const cleanedSubject = cleanCommitMessage(subject);
    const category = classifyCommit(subject);
    const normalizedSubject = cleanedSubject
        .replace(/^fix(ed)?\s+/i, category === 'Fixed' ? '' : '$&')
        .replace(/^add(ed)?\s+/i, category === 'Added' ? '' : '$&');
    const text = /^(npm|ts|jsdoc)\b/.test(normalizedSubject)
        ? normalizedSubject
        : normalizedSubject.charAt(0).toUpperCase() + normalizedSubject.slice(1);

    return `- **${category}** ${text}`;
}

function getCommitsSince(lastReleaseRef: string | null): string[] {
    const range = lastReleaseRef ? `${lastReleaseRef}..HEAD` : 'HEAD';
    const log = runGit(['log', '--reverse', '--format=%H%x09%s', range]);

    return parseGitLog(log)
        .map(({ subject }) => subject)
        .filter((subject) => subject && !subject.startsWith('Merge '))
        .filter((subject) => !isVersionSubject(subject));
}

function insertChangelogSection(changelog: string, newVersion: string, lines: string[]): string {
    const sectionLines = [
        `## [${newVersion}]`,
        '',
        ...lines,
        ''
    ];
    const section = `${sectionLines.join('\n')}\n`;

    if (changelog.startsWith('# Changelog')) {
        return changelog.replace(/^# Changelog\s*\n+/, (match) => `${match}${section}`);
    }

    return `# Changelog\n\n${section}${changelog}`;
}

async function promptReleaseType(
    currentVersion: string,
    nextVersions: Record<ReleaseType, string>
): Promise<ReleaseType> {
    const rl = readline.createInterface({
        input: stdin,
        output: stdout
    });

    try {
        while (true) {
            const answer = (await rl.question(
                [
                    `Aktuelle Version: ${currentVersion}`,
                    `major -> ${nextVersions.major}`,
                    `minor -> ${nextVersions.minor}`,
                    `patch -> ${nextVersions.patch}`,
                    'Welche Erhoehung soll verwendet werden? (major/minor/patch): '
                ].join('\n')
            )).trim().toLowerCase();

            if (answer === 'major' || answer === 'minor' || answer === 'patch') {
                return answer;
            }

            stdout.write('Bitte `major`, `minor` oder `patch` eingeben.\n\n');
        }
    } finally {
        rl.close();
    }
}

async function main(): Promise<void> {
    const packageJson = parsePackageJson(readJson(packageJsonPath));
    const packageLock = parsePackageLock(readJson(packageLockPath));
    const currentVersion = packageJson['version'];
    const nextVersions: Record<ReleaseType, string> = {
        major: bumpVersion(currentVersion, 'major'),
        minor: bumpVersion(currentVersion, 'minor'),
        patch: bumpVersion(currentVersion, 'patch')
    };
    const releaseType = await promptReleaseType(currentVersion, nextVersions);
    const newVersion = nextVersions[releaseType];
    const lastReleaseRef = findLastReleaseRef(currentVersion);
    const commits = getCommitsSince(lastReleaseRef);
    const changelogLines = commits.length
        ? commits.map(formatChangelogLine)
        : ['- **Maintenance** Version bump ohne neue Commits seit dem letzten Release'];

    packageJson['version'] = newVersion;
    packageLock['version'] = newVersion;

    const rootPackage = packageLock['packages']?.[''];
    if (rootPackage) {
        rootPackage['version'] = newVersion;
    }

    const currentChangelog = fs.readFileSync(changelogPath, 'utf8');
    const nextChangelog = insertChangelogSection(currentChangelog, newVersion, changelogLines);

    writeJson(packageJsonPath, packageJson);
    writeJson(packageLockPath, packageLock);
    fs.writeFileSync(changelogPath, nextChangelog);

    stdout.write(`Version erhoeht: ${currentVersion} -> ${newVersion}\n`);
    stdout.write(`Changelog-Eintraege: ${commits.length}\n`);
}

void main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
});
