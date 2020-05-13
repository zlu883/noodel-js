<!--------------------------- TEMPLATE ----------------------------->

<template>

    <transition 
        appear
        name="fade"
    >
        <slot></slot>
    </transition>

</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">

	import { Component, Prop, Vue } from "vue-property-decorator";

	@Component({})
	export default class AnimationFade extends Vue {

    }

</script>

<!---------------------------- STYLES ------------------------------>

<style scoped>

    .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
        opacity: 0 !important;
    } 

</style>
