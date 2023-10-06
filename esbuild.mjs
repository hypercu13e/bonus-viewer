import dedent from 'dedent';
import * as esbuild from 'esbuild';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import process from 'node:process';

const OUT_DIR = './build/';
const MODE = process.env['NODE_ENV'] === 'production' ? 'prod' : 'dev';

await clearOutDir();
await buildProject();

async function clearOutDir() {
	try {
		const stats = await fs.stat(OUT_DIR);

		await fs.rm(OUT_DIR, { recursive: true, force: true });
		await fs.mkdir(OUT_DIR, { mode: stats.mode });
	} catch (error) {
		if (
			error instanceof Error &&
			/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT'
		) {
			// Ignore.
		} else {
			throw error;
		}
	}
}

async function buildProject() {
	const version = await getVersion();
	/** @satisfies {import('esbuild').BuildOptions} */
	const commonOptions = {
		bundle: true,
		charset: 'utf8',
		logLevel: 'info',
		entryPoints: ['./src/main.mts'],
		format: 'iife',
		minifySyntax: MODE === 'prod',
		outdir: OUT_DIR,
		platform: 'browser',
		sourcemap: 'linked',
		target: 'es2022',
		treeShaking: true,
	};

	if (commonOptions.entryPoints.length !== 1) {
		// Currently, multiple entry points are neither supported nor needed.
		throw new Error('There should be only a single entry point');
	}

	if (MODE === 'dev') {
		const ctx = await esbuild.context(commonOptions);

		process.on('SIGINT', async () => {
			await ctx.cancel();
			await ctx.dispose();
		});

		await ctx.serve({ host: 'localhost', port: 8000 });
	} else {
		/** @type {import('esbuild').BuildResult<{ write: false }>} */
		let result;

		try {
			result = await esbuild.build({
				...commonOptions,
				write: false,
			});
		} catch {
			// esbuild will print all encountered errors automatically.
			return;
		}

		const [codeFiles, rest] = partitionFiles(result.outputFiles);

		await generateUserscript(codeFiles, version);
		await Promise.all(rest.map((file) => fs.writeFile(file.path, file.contents)));
	}
}

/**
 * @returns {Promise<string>}
 */
async function getVersion() {
	const manifest = await fs.readFile('./package.json', { encoding: 'utf8' });
	const { version } = JSON.parse(manifest);

	return version;
}

/**
 * @param {OutputFile[]} files
 * @param {string} version
 */
async function generateUserscript(files, version) {
	const code = files.map((file) => file.text).join('\n');
	const userscript = dedent`
		// ==UserScript==
		// @name           Bonus Viewer
		// @name:pl        Licznik bonusów
		// @namespace      https://github.com/hypercu13e
		// @version        ${version}
		// @description    Counts and displays item bonuses
		// @description:pl Dodatek zliczający i wyświetlający bonusy przedmiotów
		// @author         Hypercube
		// @icon           https://www.google.com/s2/favicons?sz=16&domain=margonem.pl
		// @icon64         https://www.google.com/s2/favicons?sz=64&domain=margonem.pl
		// @match          https://*.margonem.pl/
		// @match          https://*.margonem.com/
		// @exclude        https://www.margonem.pl/
		// @exclude        https://forum.margonem.pl/
		// @exclude        https://pomoc.margonem.pl/
		// @exclude        https://addons2.margonem.pl/
		// @exclude        https://serwery.margonem.pl/
		// @exclude        https://margonem.com/
		// @exclude        https://forum.margonem.com/
		// @exclude        https://serwery.margonem.com/
		// @grant          none
		// ==/UserScript==
		${code}
	`;

	await fs.writeFile(path.join(OUT_DIR, 'bonus-viewer.user.js'), userscript);
}

/**
 * @param {OutputFile[]} files
 * @returns {[OutputFile[], OutputFile[]]}
 */
function partitionFiles(files) {
	/** @type {OutputFile[]} */
	const codeFiles = [];
	/** @type {OutputFile[]} */
	const otherFiles = [];

	for (const file of files) {
		if (file.path.endsWith('.js')) {
			codeFiles.push(file);
		} else {
			otherFiles.push(file);
		}
	}

	return [codeFiles, otherFiles];
}

/**
 * @typedef {import('esbuild').OutputFile} OutputFile
 */
