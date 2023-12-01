import json

from pathlib import Path

tarballs = sorted(list(Path('.').glob('primer-react-*.tgz')), reverse=True)
print(tarballs)
if len(tarballs) > 1:
    print("THERE ARE MULTIPLE TARBALLS, GOING TO USE:", tarballs[0])
tarball = tarballs[0]
print("Installing tarball:", tarball)

with open('package.json') as f:
    package_json = json.load(f)

from pprint import pprint
package_json['dependencies']['@primer/react'] = f"file:{tarball.name}"
# pprint(package_json)
with open('package.json', 'w') as f:
    json.dump(package_json, f, indent=2)

import subprocess
subprocess.check_call(f"npm install {tarball.name}", shell=True)
