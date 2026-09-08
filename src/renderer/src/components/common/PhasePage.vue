<script setup lang="ts">
import { useI18n } from '../../i18n'

defineProps<{
  kicker: string
  title: string
  summary: string
}>()

const { t } = useI18n()
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
        <p>{{ t('phase.placeholder') }}</p>
      </slot>
    </div>
  </section>
</template>
