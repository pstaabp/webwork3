<template>
	<div class="q-ma-md">
		<h3 class="q-my-lg">Problem Viewer</h3>
		<q-form @submit.prevent="loadProblem">
			<q-input v-model="srcFile" label="Source File" autocomplete />
			<q-btn type="submit" class="q-my-md">Load Problem</q-btn>
		</q-form>
		<problem :sourceFilePath="file" />
	</div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import Problem from './Problem.vue';

export default defineComponent({
	name: 'ProblemViewer',
	components: {
		Problem
	},
	setup() {
		const srcFile = ref('');
		const file = ref('');

		// Test problems:
		//   # Basic
		//   Library/UBC/calculusStewart/divergence6.pg
		//   # Scaffold
		//   Contrib/CUNY/CityTech/CollegeAlgebra_Trig/ParabolaVertices/vertex-CtS-walkthrough.pg
		//   # Geogebra
		//   Contrib/CUNY/CityTech/CollegeAlgebra_Trig/setGeogebra/line-intercepts-blank-canvas.pg
		//   # Contains image
		//   Library/Michigan/Chap7Sec5/Q13.pg
		//   # Uses parserWordCompletion so MathQuill is disabled on some of the inputs
		//   Library/Hope/Multi1/03-05-Basis-subspace/Basis_11_column_space.pg

		return {
			srcFile,
			file,
			loadProblem: () => file.value = srcFile.value
		};
	}
});
</script>
