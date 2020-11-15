<!--------------------------- TEMPLATE ----------------------------->

<template>
	<div>Hello {{text}}</div>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
import { PropType, defineComponent } from "vue";

export default defineComponent({
	props: ['text'],
	methods: {
		onClick() {
			this.$emit('clicked');
		}
	}
});
</script>
