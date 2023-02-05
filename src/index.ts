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
		_ctx: ExecutionContext
	): Promise<Response> {
		const url = new URL(request.url);
		const parts = url.pathname.split("/").slice(1)
		if (parts.length == 0 || parts[0] == '') {
			return new Response("not found", {status: 404})
		}
		await lib.crypt.setup(env.JWT_KEY)
		if (parts[0] === 'favicon.ico') {
			return new Response("", {status: 404})
		} else if (parts[0] === 'auth') {
			const ghtoken = url.searchParams.get('ghtoken')
			if (!ghtoken) {
				return new Response("missing ghtoken", {status: 400})
			}
			lib.ghgist.setup(ghtoken)
			const permissions = url.searchParams.get('permissions')
			const description = url.searchParams.get('description')
			let gistId = url.searchParams.get('gistid')
			if (!gistId) {
				if (!permissions) {
					return new Response("unable to join gist without specifying permissions", { status: 400})
				}
				const gistRes = await lib.ghgist.create({description, is_public: false})
				gistId = gistRes
				console.log('gist', gistRes)
			}
			if (!gistId) {
				return new Response("can't create or find gist, is your token right?", { status: 400 })
			}
			let permissionList = []
			if (!permissions) {
				permissionList.push("get")
				permissionList.push("set")
				permissionList.push("getAll")
				permissionList.push("subgrant")
			} else {
				permissions.split(",").forEach(p => permissionList.push(p))
			}
			await lib.ghgist.peek(gistId)
			return new Response(await lib.crypt.encryptObject({ghtoken, gistId, permissions: permissionList}))
		} else {
			let { ghtoken, gistId, permissions } = await lib.crypt.decryptObject(parts[0]).catch(e => {
				console.error(e)
				return {}
			})
			console.log("data", {gistId, permissions})
			if (!ghtoken || !gistId) {
				return new Response("bad token", { status: 401 })
			}
			if (!permissions) {
				permissions = []
			}
			lib.ghgist.setup(ghtoken)
			if (parts[1] === "set") {
				if (parts.length == 3) {
					const body = await request.text()
					const path = parts.slice(2).join("/")
					if (permissions.filter((p: string) => `set${path}`.startsWith(p)).length > 0) {
						return new Response(JSON.stringify(
							await lib.ghgist.update(gistId, {
								[path]: body
							})
						))
					} else {
						return new Response("unauthorized", {status: 401})
					}
				}
			} else if (parts[1] === "peek") {
				if (parts.length === 2) {
					return new Response(JSON.stringify(
						await lib.ghgist.peek(gistId)
					))
				}
			} else if (parts[1] === "get") {
				const path = parts.slice(2).join("/")
				if (permissions.filter((p: string) => `get${path}`.startsWith(p)).length > 0) {
					return await lib.ghgist.get(gistId, path)
				} else {
					return new Response("unauthorized", {status: 401})
				}
			} else if (parts[1] === "getAll") {
				const getAllPerms = permissions.filter((p: string) => p.startsWith('getAll'))
				if (getAllPerms.length > 0) {
					const getAllCriterias = getAllPerms.map((p: string) => p.slice(6))
					const allItems = await lib.ghgist.getAll(gistId)
					let ret: Record<string,string> = {}
					Object.keys(allItems).forEach((itemKey: string) => {
						if (getAllCriterias.filter((c: string) => itemKey.startsWith(c)).length > 0) {
							ret[itemKey] = allItems[itemKey]
						}
					})
					if (parts.length === 2) {
						return new Response(JSON.stringify(ret))
					}
				} else {
					return new Response("unauthorized", {status: 401})
				}
			} else if (parts[1] === "subgrant") {
				if (permissions.filter((p: string) => 'subgrant' === p).length > 0) {
					if (parts.length == 4) {
						const [_token, _thisroute, method, payload] = permissions
						if (["get", "set", "getAll"].filter((m: string) => method.startsWith(m)).length > 0) {
							const permStr = `${method}${payload}`
							if (permissions.filter((p: string) => p.startsWith(permStr)).length > 0) {
								return new Response(await lib.crypt.encryptObject({ghtoken, gistId, permissions: [permStr]}))
							} else {
								return new Response("can't subgrant a set of permissions bigger than the set you have", {status: 401})
							}
						}
					}
				} else {
					return new Response("unauthorized", {status: 401})
				}
			}
		}
		return new Response("not found", { status: 404 })
	},
}
