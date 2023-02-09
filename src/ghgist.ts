
let githubToken: string | null = null;

export function setup(token: string) {
	githubToken = token
}

type CreateParams = {
	description: string | null,
	is_public: boolean
}
export async function create(params: CreateParams = {is_public: false, description: null}) {
	let contentObj: any = {
		public: params.is_public,
		files: {
			".gitcrud": {
				content: "This is a placeholder file because it's impossible to create empty gists"
			}
		}
	}
	if (params.description) {
		contentObj.description = params.description
	}
	const content = JSON.stringify(contentObj)

	const res = await fetch(`https://api.github.com/gists`, {
		method: 'POST',
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${githubToken}`,
			"X-GitHub-Api-Version": "2022-11-28",
			"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:102.0) Gecko/20100101 Firefox/102.0"
		},
		body: content
	})
	const json = await res.json<{id: string}>()
	return json['id']
}

export async function peek(gistId: string) {
	const res = await update(gistId, {
		".gitcrud": "This is a placeholder file because it's impossible to create empty gists"
	})
	return new Response(res.statusText, {status: res.status})
}

export async function get(gistId: string, filename: string) {
	const rawGistURL = await fetch(`https://gist.github.com/${gistId}`)
	const res = await fetch(`${rawGistURL.url}/raw/${filename}?nonce=${Math.random()}`)
	if (res.ok) {
		let response = new Response(res.body, {
			headers: {
				"Cache-Control": "private",
			}
		})
		return response
	} else {
		return new Response(res.statusText, { status: res.status })
	}
}

export async function getAll(gistId: string) {
	const res = await fetch(`https://api.github.com/gists/${gistId}`, {
		method: 'GET',
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${githubToken}`,
			"X-GitHub-Api-Version": "2022-11-28",
			"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:102.0) Gecko/20100101 Firefox/102.0"
		},
	})
	const json = await res.json<{files: Record<string, {content: string}>}>()
	let ret: Record<string,string> = {}
	Object.keys(json.files).forEach(k => {
		ret[k] = json.files[k].content
	})
	return ret
}

export async function update(gistId: string, files: Record<string,string>) {
	let input = {
		files: {} as Record<string, {content: string}>
	}
	Object.keys(files).map(file => {
		input.files[file] = {
			content: files[file]
		}
	})
	const content = JSON.stringify(input)
	const res = await fetch(`https://api.github.com/gists/${gistId}`, {
		method: 'PATCH',
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${githubToken}`,
			"X-GitHub-Api-Version": "2022-11-28",
			"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:102.0) Gecko/20100101 Firefox/102.0"
		},
		body: content
	})
	return new Response(res.statusText, { status: res.status })
}
