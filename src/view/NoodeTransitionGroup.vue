<!--------------------------- TEMPLATE ----------------------------->

<template>
	<transition-group
		name="nd-noode"
	>
		<Noode
			v-for="child in parent.children"
			:key="child.id"
			:noode="child"
			:noodel="noodel"
		/>
	</transition-group>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
import Noode from "./Noode.vue";
import NoodelState from "../types/NoodelState";
import NoodeState from "../types/NoodeState";
import { PropType, defineComponent } from "vue";

// By extracting the transition-group into its own component addresses the issue
// of enter/leave transitions not occuring properly as per https://github.com/vuejs/vue/issues/6946
export default defineComponent({
	components: {
		Noode,
	},

	props: {
		parent: Object as PropType<NoodeState>,
		noodel: Object as PropType<NoodelState>,
	}
});
</script>
