<!--------------------------- TEMPLATE ----------------------------->

<template>
	<transition-group
		name="nd-node"
	>
		<Node
			v-for="child in parent.children"
			:key="child.id"
			:node="child"
			:noodel="noodel"
		/>
	</transition-group>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
import Node from "./Node.vue";
import NoodelState from "../types/NoodelState";
import NodeState from "../types/NodeState";
import { PropType, defineComponent } from "vue";

// By extracting the transition-group into its own component addresses the issue
// of enter/leave transitions not occuring properly as per https://github.com/vuejs/vue/issues/6946
export default defineComponent({
	components: {
		Node,
	},

	props: {
		parent: Object as PropType<NodeState>,
		noodel: Object as PropType<NoodelState>,
	}
});
</script>
