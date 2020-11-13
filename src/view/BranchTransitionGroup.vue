<!--------------------------- TEMPLATE ----------------------------->

<template>
	<transition-group 
		name="nd-branch" 
		:css="noodel.isMounted"
	>
		<Branch
			v-for="parent in allParents"
			:key="parent.id"
			:parent="parent"
			:noodel="noodel"
		/>
	</transition-group>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
import Branch from "./Branch.vue";
import NoodelState from "../types/NoodelState";
import NodeState from "../types/NodeState";
import { PropType, defineComponent } from "vue";

// By extracting the transition-group into its own component addresses the issue
// of enter/leave transitions not occuring properly as per https://github.com/vuejs/vue/issues/6946
export default defineComponent({
	components: {
		Branch,
	},

	props: {
		allParents: Object as PropType<NodeState[]>,
		noodel: Object as PropType<NoodelState>,
	}
});
</script>
