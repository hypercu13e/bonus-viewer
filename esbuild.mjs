import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import process from 'node:process';
import { isNativeError } from 'node:util/types';
import dedent from 'dedent';
import * as esbuild from 'esbuild';
import packageManifest from './package.json' with { type: 'json' };

const OUT_DIR = path.resolve('build');
/** @type {import('esbuild').BuildOptions} */
const COMMON_BUILD_OPTIONS = {
	charset: 'utf8',
	entryPoints: [path.join('src', 'main.mts')],
	keepNames: true,
	sourcemap: 'linked',
	target: 'es2022',
	tsconfig: 'tsconfig.ts.json',
};

await clearOutDir();

switch (process.env['NODE_ENV']) {
	case 'production':
		await buildProjectProd();
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
			isNativeError(error) &&
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
		define: {
			'globalThis.DEV': 'true',
		},
		format: 'iife',
		logLevel: 'info',
		outfile: path.join(OUT_DIR, 'main.js'),
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
	const userScriptBanner = dedent`
		// ==UserScript==
		// @name           Bonus Viewer
		// @name:pl        Licznik bonusów
		// @namespace      https://github.com/hypercu13e
		// @version        ${packageManifest.version}
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
	`;

	await esbuild.build({
		...COMMON_BUILD_OPTIONS,
		banner: {
			js: userScriptBanner,
		},
		bundle: true,
		define: {
			'globalThis.DEV': 'false',
		},
		format: 'iife',
		logLevel: 'info',
		outfile: path.join(OUT_DIR, 'bonus-viewer.js'),
		minifySyntax: true,
		platform: 'browser',
		treeShaking: true,
	});
}
