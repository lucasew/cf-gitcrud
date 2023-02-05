
let githubToken: string | null = null;

export function setup(token: string) {
	githubToken = token
}


export async function create(params = {description: string | null, is_public: boolean = false}) {
	let contentObj = {
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
	const json = await res.json()
	console.log(json)
	return json['id']
}

export async function peek(gistId: string) {
	return await update(gistId, {
		".gitcrud": "This is a placeholder file because it's impossible to create empty gists"
	})
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
	const json = await res.json()
	let ret = {}
	Object.keys(json.files).forEach(k => {
		ret[k] = json.files[k].content
	})
	return ret
}

export async function update(gistId: string, files: Record<string,string>) {
	let input = {
		files: {}
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
	return await res.json()
}