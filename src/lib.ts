const algorithm = "ES256";
const salt = "f0e2081c-f412-4b76-b1e3-deddbef1c1e0"
const utf8encoder = new TextEncoder('utf-8')
const utf8decoder = new TextDecoder('utf-8')
export let key: crypto.CryptoKey | null = null;
let iv = null;

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
		iv = crypto.getRandomValues(new Uint8Array(12))
	}
}

export async function encryptObject(obj) {
	const serialized = JSON.stringify(obj)
	const decryptBytes = utf8encoder.encode(serialized)
	const cryptBytes = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		key,
		decryptBytes.buffer
	)
	return decodeBuffer(cryptBytes)
}

export function decodeBuffer(buf: ArrayBuffer) {
	const buf2 = new Uint8Array(buf)
	let arr = Array(buf2.length).fill('')
	for (let i = 0; i < buf2.length; i++) {
		arr[i] = String.fromCharCode(buf2[i])
	}
	return btoa(arr.join(''))
}

export function encodeBuffer(encoded: string) {
	const dec = atob(encoded)
	let ret = new Uint8Array(dec.length)
	for (let i = 0; i < dec.length; i++) {
		ret[i] = dec.charCodeAt(i)
	}
	return ret
}

export async function decryptObject(ciphertext) {
	const cryptBytes = encodeBuffer(ciphertext)
	const decryptBytes = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv },
		key,
		cryptBytes
	)
	const serialized = utf8decoder.decode(decryptBytes)
	return JSON.parse(serialized)
}

async function setup() {
	const pemEncoded = '';

	privateKey = await jose.importPKCS8(pemEncoded, "ES256");
}
