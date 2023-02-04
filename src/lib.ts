const utf8encoder = new TextEncoder('utf-8')
const utf8decoder = new TextDecoder('utf-8')
export let key: crypto.CryptoKey | null = null;

async function generateKeyFromSecret(secret: string) {
	const derivedSecret = await crypto.subtle.importKey(
		'raw',
		utf8encoder.encode(secret),
		"PBKDF2",
		false,
		['deriveKey']
	)
	const derivedKey = await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: utf8encoder.encode("f0e2081c-f412-4b76-b1e3-deddbef1c1e0"),
			iterations: 100,
			hash: 'SHA-256'
		},
		derivedSecret,
		{ name: 'AES-GCM', length: 256}, // key that we want
		false,                           // extractable
		['encrypt', 'decrypt']
	)
	return derivedKey
}

export async function setupEncryption(secret: string) {
	if (!key) {
		key = await generateKeyFromSecret(secret)
	}
}

export async function encryptObject(obj: Object) {
	const iv = crypto.getRandomValues(new Uint8Array(12))
	const serialized = JSON.stringify(obj)
	const decryptBytes = utf8encoder.encode(serialized)
	const cryptBytes = new Uint8Array(await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		key,
		decryptBytes.buffer
	))
	let ret = new Uint8Array(iv.length + cryptBytes.length)
	for (let i = 0; i < iv.length; i++) {
		ret[i] = iv[i]
	}
	for (let i = 0; i < cryptBytes.length; i++) {
		ret[i + iv.length] = cryptBytes[i]
	}
	return decodeBuffer(ret)
}

export function decodeBuffer(buf: Uint8Array): string {
	const buf2 = new Uint8Array(buf)
	let arr = Array(buf2.length).fill('')
	for (let i = 0; i < buf2.length; i++) {
		arr[i] = String.fromCharCode(buf2[i])
	}
	return btoa(arr.join(''))
}

export function encodeBuffer(encoded: string): Uint8Array {
	const dec = atob(encoded)
	let ret = new Uint8Array(dec.length)
	for (let i = 0; i < dec.length; i++) {
		ret[i] = dec.charCodeAt(i)
	}
	return ret
}

export async function decryptObject(ciphertext: string) {
	let iv = new Uint8Array(12)
	const decoded = encodeBuffer(ciphertext)
	const payloadBytes = decoded.length - iv.length;
	let cryptBytes = new Uint8Array(payloadBytes)
	for (let i = 0; i < iv.length; i++) {
		iv[i] = decoded[i]
	}
	for (let i = 0; i < payloadBytes; i++) {
		cryptBytes[i] = decoded[iv.length + i];
	}
	console.log(iv, cryptBytes)
	const decryptBytes = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv },
		key,
		cryptBytes
	)
	const serialized = utf8decoder.decode(decryptBytes)
	return JSON.parse(serialized)
}

