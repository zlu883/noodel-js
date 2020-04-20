<!--------------------------- TEMPLATE ----------------------------->

<template>

    <div>
        <AnimationFade>
            <div class="nd-limit nd-limit-left" v-show="store.showLimits.left"/>
        </AnimationFade>
        <AnimationFade>
            <div class="nd-limit nd-limit-right" v-show="store.showLimits.right"/>
        </AnimationFade>
        <AnimationFade>
            <div class="nd-limit nd-limit-top" v-show="store.showLimits.top"/>
        </AnimationFade>
        <AnimationFade>
            <div class="nd-limit nd-limit-bottom" v-show="store.showLimits.bottom"/>
        </AnimationFade>
    </div>

</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">

    import { Component, Vue, Prop } from "vue-property-decorator";

    import AnimationFade from './AnimationFade.vue';
    import NoodelView from '../model/NoodelView';

	@Component({
        components: {
            AnimationFade
        }
    })
    export default class NoodelLimits extends Vue {
        
        @Prop() store: NoodelView;
    }
    
</script>

<!---------------------------- STYLES ------------------------------>

<style>

    .nd-limit {
        position: absolute;
        z-index: 9999;
        border: solid 0px;
    }

    .nd-limit-left {   
        top: 0;
        left: 0;
        height: 100%;
        width: 2em;
        background-color: #116488;
        border-top-right-radius: 2em;
        border-bottom-right-radius: 2em;
    }

    .nd-limit-right {
        top: 0;
        right: 0;
        height: 100%;
        width: 2em;
        background-color: #116488;
        border-top-left-radius: 2em;
        border-bottom-left-radius: 2em;
    }

    .nd-limit-top {
        top: 0;
        left: 0;
        height: 2em;
        width: 100%;
        background-color: #116488;
        border-bottom-right-radius: 2em;
        border-bottom-left-radius: 2em;
    }

    .nd-limit-bottom {
        bottom: 0;
        left: 0;
        height: 2em;
        width: 100%;
        background-color: #116488;
        border-top-right-radius: 2em;
        border-top-left-radius: 2em;
    }
   
</style>