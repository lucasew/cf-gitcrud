# cf-gitcrud

Basic storage for small textual values based on GitHub Gists but allows you to borrow your GitHub token safely (I expect).

# Where is the app state stored
- TL;DR: Gists for content only, credentials in your token.
    - You read it right. The raw GitHub token is AES encrypted along with the permissions and the Gist ID. It's safe as long as the secret passphrase used internally don't leak. Changing the internal passphrase will invalidate all tokens at once so those will need to be regenerated.

# Routes

- `/auth` Authenticate an entity and generate a encrypted token
    - Query params
        - `ghtoken` (required): GitHub Personal Access Token
        - `gistid` (optional): Gist ID that belongs to your account or you have access. If not available a new one will be created.
        - `description` (optional): Sent as description if the Gist is being created.
        - `permissions` (required if not creating a gist): Permissions for the generated token as a comma separated list of values. All the permissions are in the form `${method}${parameter}`. Ex: `getexample` allows accessing all the keys that start with example. The available permission classes are `get`, `set`, `getAll` and `subgrant`. `subgrant` is the only one that does not have a parameter and allows the user to create another token to access a subset of the user already has access defined by one permission only.
- `/:token/get/:path*`: Get content of a key. Folders are not supported by Gist.
- `/:token/set/:path*`: Set content of a key. Folders are not supported by Gist.
- `/:token/peek`: Test if the gist is accesible and editable by the backing token by creating a dummy file (`.gitcrud`) in the gist.
- `/:token/getAll`: List all accessible keys with their values available in the Gist.
- `/:token/subgrant/:method/:payload`: Create another token with one permission that is a subset of the permissions available in the current token.

# Limitations
- Gist content has a cache TTL of 300s by default. That's the time it takes for a new information to be available to subsequent GETs. This app uses Cloudflare's caching system to overcome this limitation but that may have rough edges, be cafreful.
