<!--------------------------- TEMPLATE ----------------------------->

<template>

    <transition 
        name="fade"
    >
        <slot></slot>
    </transition>

</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">

    import Vue from 'vue';

    export default Vue.extend({

    });

</script>

<!---------------------------- STYLES ------------------------------>

<style scoped>

    .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
        opacity: 0 !important;
    } 

</style>
