<!--------------------------- TEMPLATE ----------------------------->

<template>

    <div>
        <div>{{textA}} {{textB}}</div>
        <button @click.stop="onButtonClick">Test</button>
    </div>
    
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">

    import Vue from 'vue';

    export default Vue.extend({

        props: ['textA', 'textB'],

        methods: {
            onButtonClick() {
                console.log("triggered button click")
                this.$emit('buttonClick')
            }
        }
    });
    
</script>

<!---------------------------- STYLES ------------------------------>

<style>
    
</style>
