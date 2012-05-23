#!/bin/sh

# ensure script runs from correct directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd ${DIR}

# ensure submodules are up-to-date
cd ../
git submodule init
git submodule update

cd ${DIR}

# ensure build directory exists
mkdir -p ../build/

# remove old files
rm -f ../build/*.js ../build/*.js.gz

# concatenate required phpjs files
cat ../libs/phpjs/functions/classobj/get_class_methods.js ../libs/phpjs/functions/misc/uniqid.js ../libs/phpjs/functions/array/array_diff.js ../libs/phpjs/functions/array/array_keys.js ../libs/phpjs/functions/array/array_values.js ../libs/phpjs/functions/var/is_array.js ../libs/phpjs/functions/url/base64_encode.js ../libs/phpjs/functions/xml/utf8_encode.js ../libs/phpjs/functions/strings/md5.js ../libs/phpjs/functions/url/urlencode.js ../libs/phpjs/functions/url/http_build_query.js > ../build/phpjs-deps.js

# concatenate required libs and libAurora.js files
cat ../libs/EventTarget.js/EventTarget.js ../build/phpjs-deps.js ../LICENSE.js ../Aurora/Addon/abstracts.js ../Aurora/Addon/WebAPI.js > ../build/libAurora.js

# if the closure compiler is present, minify javascript
if [ -f ../../compiler.jar ];
then
	java -jar ../../compiler.jar --js ../build/libAurora.js --js_output_file ../build/libAurora.min.js

	# pre-gzip minified JS, using 7-zip standalone if present
	if [ -f ../../7za.exe ];
	then
		../../7za.exe a -tgzip ../build/libAurora.min.js.gz ../build/libAurora.min.js -mx=9 -mfb=258 -mpass=15
	else
		gzip -cf --best ../build/libAurora.min.js > ../build/libAurora.min.js.gz
	fi
fi;

# pre-gzip JS files, using 7-zip standalone if present
if [ -f ../../7za.exe ];
then
	../../7za.exe a -tgzip ../build/libAurora.js.gz ../build/libAurora.js -mx=9 -mfb=258 -mpass=15
else
	gzip -cf --best ../build/libAurora.js > ../build/libAurora.js.gz
fi;
