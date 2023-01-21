{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  nativeBuildInputs = [
    pkgs.nodejs
    pkgs.libudev-zero
  ];

  shellHook = ''
    export LD_LIBRARY_PATH=${pkgs.libudev-zero}/lib
  '';
}
