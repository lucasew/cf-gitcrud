import * as jose from 'jose';
import * as lib from './lib.ts';

// ALERT: You have to define JWT_KEY as secret before running this
// echo <yoursecret> | wrangler secret put JWT_KEY
/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		try {
			console.log(env.JWT_KEY);
			await lib.setupEncryption(env.JWT_KEY)
			console.log("key")
			console.log(lib.key)
			// console.log("key", await crypto.subtle.exportKey('raw', lib.key))
			const encrypted = await lib.encryptObject({a: 2})
			console.log('encrypted_result', encrypted)
			console.log(await lib.decryptObject(encrypted))
			return new Response();
		} catch (e) {
			console.error(e)
			return new Response("deu cagada")
		}
	},
};
