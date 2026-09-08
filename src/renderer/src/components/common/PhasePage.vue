<script setup lang="ts">
defineProps<{
  kicker: string
  title: string
  summary: string
}>()
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div class="kicker">{{ kicker }}</div>
      <h1>{{ title }}</h1>
      <p>{{ summary }}</p>
    </header>
    <div class="panel empty-state">
      <slot>
        <p>此模块页面框架已就绪，具体业务将在对应开发阶段实现。</p>
      </slot>
    </div>
  </section>
</template>
