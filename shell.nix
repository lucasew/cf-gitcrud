{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = with pkgs; [ wrangler nodejs nodePackages.typescript-language-server ];
}
