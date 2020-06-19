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

    import Vue, { PropType } from 'vue';

    import AnimationFade from './AnimationFade.vue';
    import NoodelView from '@/types/NoodelView';

    export default Vue.extend({

        components: {
            AnimationFade
        },
        props: {
            store: Object as PropType<NoodelView>
        }
        
    });
    
</script>

<!---------------------------- STYLES ------------------------------>

<style>

    .nd-limit {
        position: absolute;
        z-index: 9999;
        border: solid 0px;
        background-color: #595959;
        transition-property: opacity;
        transition-duration: 0.5s;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
    }

    .nd-limit-left {   
        top: 0;
        left: 0;
        height: 100%;
        width: 2em;
        border-top-right-radius: 2em;
        border-bottom-right-radius: 2em;
    }

    .nd-limit-right {
        top: 0;
        right: 0;
        height: 100%;
        width: 2em;
        border-top-left-radius: 2em;
        border-bottom-left-radius: 2em;
    }

    .nd-limit-top {
        top: 0;
        left: 0;
        height: 2em;
        width: 100%;
        border-bottom-right-radius: 2em;
        border-bottom-left-radius: 2em;
    }

    .nd-limit-bottom {
        bottom: 0;
        left: 0;
        height: 2em;
        width: 100%;
        border-top-right-radius: 2em;
        border-top-left-radius: 2em;
    }
   
</style>