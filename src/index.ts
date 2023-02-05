import * as lib from './lib';

// ALERT: You have to define JWT_KEY as secret before running this
// echo <yoursecret> | wrangler secret put JWT_KEY

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	JWT_KEY: string
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const url = new URL(request.url);
		const parts = url.pathname.split("/").slice(1)
		if (parts.length == 0 || parts[0] == '') {
			return new Response("not found", {status: 404})
		}
		await lib.crypt.setup(env.JWT_KEY)

		if (parts[0] === 'auth') {
			const ghtoken = url.searchParams.get('ghtoken')
			if (!ghtoken) {
				return new Response("missing ghtoken", {status: 400})
			}
			lib.ghgist.setup(ghtoken)
			const description = url.searchParams.get('description')
			let gistId = url.searchParams.get('gistid')
			if (!gistId) {
				const gistRes = await lib.ghgist.create({description, is_public: false})
				gistId = gistRes
				console.log('gist', gistRes)
			}
			if (!gistId) {
				return new Response("can't create or find gist, is your token right?", { status: 400 })
			}
			await lib.ghgist.peek(gistId)
			return new Response(await lib.crypt.encryptObject({ghtoken, gistId}))
		} else {
			const { ghtoken, gistId } = await lib.crypt.decryptObject(parts[0])
			lib.ghgist.setup(ghtoken)
			if (parts[1] === "set") {
				if (parts.length == 3) {
					const body = await request.text()
					const path = parts.slice(2).join("/")
					return new Response(JSON.stringify(
						await lib.ghgist.update(gistId, {
							[path]: body
						})
					))
				}
			} else if (parts[1] === "peek") {
				if (parts.length === 2) {
					return new Response(JSON.stringify(
						await lib.ghgist.peek(gistId)
					))
				}
			} else if (parts[1] === "get") {
				const path = parts.slice(2).join("/")
				const files = await lib.ghgist.getAll(gistId)
				const file = files[path];
				if (!file) {
					return new Response("file not found", {status: 404})
				} else {
					return new Response(file)
				}
			} else if (parts[1] === "getAll") {
				if (parts.length === 2) {
					return new Response(JSON.stringify(
						await lib.ghgist.getAll(gistId)
					))
				}
			}
		}
		return new Response("not found", { status: 404 })

		// try {
		// 	const encrypted = await lib.crypt.encryptObject({a: 2})
		// 	console.log('encrypted_result', encrypted)
		// 	console.log(await lib.crypt.decryptObject(encrypted))
		// 	// console.log("content", await request.text())
		// 	// return new Response(await lib.createGist({description: "Teste", is_public: false}))
		// 	// return new Response(JSON.stringify(await lib.peekGist("3ff9263ce5798bc57ab3f951a455d213")))
		// 	// return new Response(JSON.stringify(await lib.updateGist("3ff9263ce5798bc57ab3f951a455d213", {
		// 		// a: "2",
		// 		// eoq: "trabson"
		// 	// })))
		// 	return new Response("foi")
		// } catch (e) {
		// 	console.error(e)
		// 	return new Response("deu cagada")
		// }
	},
}
