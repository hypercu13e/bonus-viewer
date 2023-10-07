import dedent from 'dedent';
import * as esbuild from 'esbuild';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import process from 'node:process';

const OUT_DIR = './build/';
/** @type {import('esbuild').BuildOptions} */
const COMMON_BUILD_OPTIONS = {
	charset: 'utf8',
	outdir: OUT_DIR,
	sourcemap: 'linked',
	target: 'es2022',
};

await clearOutDir();

switch (process.env['NODE_ENV']) {
	case 'development':
		await buildProjectDev();
		break;
	case 'production':
		await buildProjectProd();
		break;
	case 'test':
		await buildProjectTest();
		break;
	default:
		await buildProjectDev();
}

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

async function buildProjectDev() {
	const ctx = await esbuild.context({
		...COMMON_BUILD_OPTIONS,
		bundle: true,
		entryPoints: ['./src/main.mts'],
		format: 'iife',
		logLevel: 'info',
		platform: 'browser',
		treeShaking: true,
	});

	process.on('SIGINT', async () => {
		await ctx.cancel();
		await ctx.dispose();
	});

	await ctx.serve({ host: 'localhost', port: 8000 });
}

async function buildProjectProd() {
	/** @type {import('esbuild').BuildResult<{ write: false }>} */
	let result;

	try {
		result = await esbuild.build({
			...COMMON_BUILD_OPTIONS,
			bundle: true,
			dropLabels: ['DEV'],
			entryPoints: ['./src/main.mts'],
			format: 'iife',
			logLevel: 'info',
			minifySyntax: true,
			platform: 'browser',
			treeShaking: true,
			write: false,
		});
	} catch {
		// esbuild will print all encountered errors automatically.
		return;
	}

	const version = await getVersion();
	const [codeFiles, rest] = partitionFiles(result.outputFiles);

	await generateUserscript(codeFiles, version);
	await Promise.all(rest.map((file) => fs.writeFile(file.path, file.contents)));

	// =========================================================================================

	/**
	 * @typedef {import('esbuild').OutputFile} OutputFile
	 */

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
}

async function buildProjectTest() {
	const files = await fs.readdir('./src/', { recursive: true, withFileTypes: true });

	await esbuild.build({
		...COMMON_BUILD_OPTIONS,
		drop: ['console'],
		dropLabels: ['DEV'],
		entryPoints: files
			.filter((entry) => entry.isFile() && path.extname(entry.name) === '.mts')
			.map((entry) => path.join(entry.path, entry.name)),
		format: 'esm',
		logLevel: 'error',
		outExtension: { '.js': '.mjs' },
		platform: 'node',
	});
}
