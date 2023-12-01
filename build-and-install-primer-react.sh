#!/bin/bash


set -e

pushd /Users/peterbe/dev/GITHUB/primer/react
npm run build
npm pack --pack-destination /Users/peterbe/dev/GITHUB/DOCS/primer-autocomplete
popd

python install-latest-primer-react-tarball.py
