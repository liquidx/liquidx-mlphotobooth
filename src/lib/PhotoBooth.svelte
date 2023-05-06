<script lang="ts">
	import {
		initPhotoBooth,
		onCaptureDownload,
		onStopRecognition,
		onStartRecognition,
		onSelectDevice
	} from './mlphotobooth.js';

	import { browser } from '$app/environment';

	let sourcesElement: null | HTMLSelectElement = null;
	let loaderElement: null | HTMLDivElement = null;
	let videoElement: null | HTMLVideoElement = null;
	let previewElement: null | HTMLCanvasElement = null;
	let sceneElement: null | HTMLCanvasElement = null;

	$: {
		if (browser) {
			initPhotoBooth({ sourcesElement, loaderElement, videoElement, previewElement, sceneElement });
		}
	}
</script>

<section id="faceViewer">
	<canvas id="scene" class="bg-gray-400 rounded" bind:this={sceneElement} />
	<canvas
		id="preview"
		width="640"
		height="480"
		class="hidden bg-gray-400 rounded"
		bind:this={previewElement}
	/>
	<div id="loader" class="hidden" bind:this={loaderElement}>Loading...</div>
</section>

<p class="text-xs">
	<button
		on:click={onStartRecognition}
		class="px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-400 m-2">Start</button
	>
	<button
		on:click={onStopRecognition}
		class="px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-400 m-2">Stop</button
	>
	<button
		on:click={onCaptureDownload}
		class="px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-400 m-2">Capture</button
	>
	<select
		id="sources"
		on:change={onSelectDevice}
		bind:this={sourcesElement}
		class="px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-400 m-2"
	/>
</p>

<div id="debugConsole" class="hide" />

<!-- svelte-ignore a11y-media-has-caption -->
<video
	id="video"
	playsinline
	bind:this={videoElement}
	style="
          transform: scaleX(-1);
          visibility: hidden;
          width: auto;
          height: auto;
          "
/>
<!-- svelte-ignore a11y-invalid-attribute -->
<a href="#" class="hidden" id="downloadLink">Download</a>

<style lang="postcss">
	.hide {
		display: none;
	}

	section#faceViewer {
		position: relative;
	}

	#faceDemoStart {
		border-bottom: none;
		background-color: #102c10;
		border-radius: 2px;
		padding: 0.5rem 1rem;
	}

	#faceDemoStop {
		border-bottom: none;
		background-color: #2b2221;
		border-radius: 2px;
		padding: 0.5rem 1rem;
	}

	#faceDemoCapture {
		border-bottom: none;
		background-color: #081720;
		border-radius: 2px;
		padding: 0.5rem 1rem;
	}

	#scene {
		width: 640px;
		height: 480px;
	}

	#preview {
		position: absolute;
		top: 10px;
		right: 10px;
		width: 100px;
		height: 100px;
		background: #222222;
	}

	#loader {
		position: absolute;
		top: 20px;
		left: 20px;
		font-size: 0.8rem;
		padding: 5px 15px;
		border-radius: 20px;
		background-color: rgba(255, 255, 255, 0.3);
		color: rgb(200, 200, 200);

		background: linear-gradient(90deg, #acacac 0%, #ffffff 50%, #acacac 100%);
		background-position: -4rem top; /*50px*/
		background-repeat: no-repeat;
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		animation-name: shimmer;
		animation-duration: 2.2s;
		animation-iteration-count: infinite;
		background-size: 4rem 100%; /*50px*/
	}

	#sources {
		-webkit-appearance: none;
		appearance: none;
		border-radius: 2rem;
		padding: 0.5rem 1rem;
		margin: 0.5rem;
		min-width: 10rem;
	}

	#video {
		display: none;
	}

	@-webkit-keyframes shimmer {
		0% {
			background-position: -4rem top; /*50px*/
		}
		70% {
			background-position: 6rem top; /*200px*/
		}
		100% {
			background-position: 6rem top; /*200px*/
		}
	}
</style>
