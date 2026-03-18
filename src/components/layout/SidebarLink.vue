<template>
  <RouterLink :to="to" class="nav-link" :class="{ active: isActive, collapsed }">
    <div class="nav-icon-wrap">
      <component :is="iconComponent" :size="18" class="nav-icon" />
      <!-- Badge dot saat sidebar collapsed -->
      <span class="badge-dot" v-if="collapsed && badge > 0">{{ badge > 9 ? '9+' : badge }}</span>
    </div>
    <Transition name="fade">
      <span v-if="!collapsed" class="nav-label">
        {{ label }}
        <!-- Badge counter saat sidebar expanded -->
        <span class="badge-counter" v-if="badge > 0">{{ badge > 99 ? '99+' : badge }}</span>
      </span>
    </Transition>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import * as icons from 'lucide-vue-next'

const props = defineProps({
  to:        String,
  icon:      String,
  label:     String,
  collapsed: Boolean,
  badge:     { type: Number, default: 0 }
})

const route = useRoute()
const isActive      = computed(() => route.path === props.to || route.path.startsWith(props.to + '/'))
const iconComponent = computed(() => icons[props.icon] || icons.Circle)
</script>

<style scoped>
.nav-link {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: var(--radius-md);
  color: rgba(255,255,255,0.6); text-decoration: none;
  font-size: 0.875rem; font-weight: 500;
  transition: all var(--transition); white-space: nowrap; overflow: hidden;
}
.nav-link:hover { background: rgba(255,255,255,0.1); color: #fff; }
.nav-link.active { background: rgba(200,169,110,0.2); color: var(--clr-accent); }

.nav-icon-wrap { position: relative; flex-shrink: 0; }
.nav-icon { display: block; }

/* Badge dot (collapsed sidebar) */
.badge-dot {
  position: absolute; top: -5px; right: -6px;
  background: var(--clr-danger); color: #fff;
  border-radius: 99px; font-size: 0.55rem; font-weight: 700;
  min-width: 14px; height: 14px; padding: 0 3px;
  display: flex; align-items: center; justify-content: center;
  border: 1.5px solid var(--clr-primary);
}

/* Badge counter (expanded sidebar, inline with label) */
.nav-label {
  flex: 1; overflow: hidden; text-overflow: ellipsis;
  display: flex; align-items: center; gap: 6px;
}
.badge-counter {
  background: var(--clr-danger); color: #fff;
  border-radius: 99px; font-size: 0.6rem; font-weight: 700;
  min-width: 18px; height: 18px; padding: 0 5px;
  display: inline-flex; align-items: center; justify-content: center;
  margin-left: auto;
}
</style>