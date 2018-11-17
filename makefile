default:
	electron-packager source/ Sirius --platform=darwin --arch=x64 --electron-version=1.8.8 --overwrite

run:
	npx electron ./source
