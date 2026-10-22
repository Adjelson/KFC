#!/usr/bin/env python3
"""Build a development APK, honouring the cloud HTTPS proxy without disabling TLS."""
import os
from pathlib import Path
import shutil
import subprocess
import urllib.parse
import urllib.request

root = Path(__file__).resolve().parent.parent
env = os.environ.copy()
local_jdk = Path('/workspace/jdk21/runtime')
if not env.get('JAVA_HOME') and local_jdk.is_dir():
    env['JAVA_HOME'] = str(local_jdk)
sdk = Path(env.get('ANDROID_HOME', '/workspace/android-sdk'))
if not sdk.is_dir():
    raise SystemExit('Install Android SDK 36 and build-tools 36.0.0; set ANDROID_HOME.')
env.setdefault('ANDROID_HOME', str(sdk))
env.setdefault('ANDROID_USER_HOME', '/workspace/.android')
env.setdefault('GRADLE_USER_HOME', '/workspace/.gradle')
proxy = urllib.parse.urlparse(urllib.request.getproxies().get('https', ''))
java_home_dir = Path('/workspace/.java-home')
java_home_dir.mkdir(exist_ok=True)
options = [f'-Duser.home={java_home_dir}']
if proxy.hostname:
    for scheme in ('https', 'http'):
        options += [f'-D{scheme}.proxyHost={proxy.hostname}', f'-D{scheme}.proxyPort={proxy.port or 80}']
if options:
    env['JAVA_TOOL_OPTIONS'] = env.get('JAVA_TOOL_OPTIONS', '') + ' ' + ' '.join(options)
subprocess.run(['npm', 'run', 'android:sync'], cwd=root, env=env, check=True)
subprocess.run(['./gradlew', '--no-daemon', '--max-workers=2', 'assembleDebug'], cwd=root/'android', env=env, check=True)
apk = root/'android/app/build/outputs/apk/debug/app-debug.apk'
subprocess.run([str(sdk/'build-tools/36.0.0/apksigner'), 'verify', str(apk)], env=env, check=True)
output = root/'artifacts/monta-treino-debug.apk'
output.parent.mkdir(exist_ok=True)
shutil.copy2(apk, output)
print(f'APK verified: {output}')
