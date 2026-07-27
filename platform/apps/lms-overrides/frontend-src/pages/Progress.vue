<template>
	<div class="flex min-h-0 flex-1 flex-col p-5 pb-10">
		<!-- Page header -->
		<div class="flex items-center gap-3 mb-1">
			<div class="cse-hbar"></div>
			<div class="cse-h1">{{ __('Progress') }}</div>
		</div>
		<div class="cse-sub mb-6">{{ __('Your training across every discipline.') }}</div>

		<div v-if="progress.data" class="cse-grid">
			<!-- Left: discipline cards -->
			<div class="cse-col-left">
				<template v-if="progress.data.disciplines.length">
					<div v-for="d in progress.data.disciplines" :key="d.name" class="cse-disc">
						<div class="cse-ring">
							<svg width="64" height="64" viewBox="0 0 64 64">
								<circle cx="32" cy="32" r="26" fill="none" stroke="#EEF0F5" stroke-width="8" />
								<circle
									cx="32" cy="32" r="26" fill="none" stroke="#DB2B3A" stroke-width="8"
									stroke-linecap="round"
									:stroke-dasharray="`${(d.percent / 100 * 163.36).toFixed(1)} 163.36`"
									transform="rotate(-90 32 32)"
								/>
							</svg>
							<div class="cse-ring-label">{{ d.percent }}%</div>
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2.5 flex-wrap">
								<div class="cse-disc-name">{{ d.name }}</div>
								<span class="cse-pill" :class="`cse-pill--${d.key}`">
									{{ d.courses_active }} {{ d.courses_active === 1 ? __('course active') : __('courses active') }}
								</span>
							</div>
							<div class="cse-disc-meta">
								{{ d.lessons_done }} {{ __('of') }} {{ d.lessons_total }} {{ __('lessons') }} ·
								{{ d.trained }} {{ __('trained') }}
							</div>
						</div>
						<router-link :to="{ name: 'Courses' }" class="cse-link">{{ __('View courses') }}</router-link>
					</div>
				</template>
				<div v-else class="cse-empty">
					<div class="cse-empty-badge"><TrendingUp class="size-6 stroke-[1.75]" /></div>
					<div class="cse-empty-title">{{ __('No training yet') }}</div>
					<div class="cse-empty-sub">{{ __('Enroll in a course to start tracking your progress.') }}</div>
					<router-link :to="{ name: 'Courses' }" class="cse-cta">{{ __('Browse courses') }}</router-link>
				</div>
			</div>

			<!-- Right: all-time + milestones -->
			<div class="cse-col-right">
				<div class="cse-alltime">
					<div class="cse-alltime-eyebrow">{{ __('All time') }}</div>
					<div class="flex gap-8 mt-3.5">
						<div>
							<div class="cse-stat">{{ progress.data.all_time.lessons }}</div>
							<div class="cse-stat-label">{{ __('lessons completed') }}</div>
						</div>
						<div>
							<div class="cse-stat">{{ progress.data.all_time.trained }}</div>
							<div class="cse-stat-label">{{ __('time trained (est.)') }}</div>
						</div>
					</div>
				</div>

				<div class="cse-miles">
					<div class="cse-miles-title">{{ __('Milestones') }}</div>
					<div class="flex flex-col gap-3.5 mt-4">
						<div
							v-for="m in progress.data.milestones"
							:key="m.key"
							class="flex items-center gap-3"
							:style="m.earned ? '' : 'opacity:0.55'"
						>
							<div class="cse-mile-badge" :class="m.earned ? 'cse-mile-badge--on' : 'cse-mile-badge--off'">
								<component :is="iconFor(m.icon)" class="size-[15px] stroke-2" />
							</div>
							<div class="flex-1 min-w-0">
								<div class="cse-mile-name">{{ __(m.title) }}</div>
								<div class="cse-mile-sub">{{ m.subtitle }}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import { createResource, usePageMeta } from 'frappe-ui'
import { Award, Calendar, Check, Target, TrendingUp } from 'lucide-vue-next'
import { sessionStore } from '@/stores/session'

const { brand } = sessionStore()

const progress = createResource({
	url: 'cse_branding.progress.student_progress',
	auto: true,
})

const iconMap = { check: Check, calendar: Calendar, target: Target, award: Award }
const iconFor = (key) => iconMap[key] || Check

usePageMeta(() => ({ title: __('Progress'), icon: brand?.favicon }))
</script>
<style scoped>
.cse-hbar { width: 4px; height: 30px; background: #db2b3a; border-radius: 2px; flex: none; }
.cse-h1 {
	font-family: var(--cse-font-display, 'Saira Condensed'), sans-serif;
	font-weight: 700; font-size: 30px; letter-spacing: 0.04em; text-transform: uppercase; color: #131c3f; line-height: 1;
}
.cse-sub { font-size: 14px; color: #5a6378; margin-left: 18px; }
.cse-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; align-items: start; }
.cse-col-left { grid-column: span 8; display: flex; flex-direction: column; gap: 16px; }
.cse-col-right { grid-column: span 4; display: flex; flex-direction: column; gap: 16px; }
@media (max-width: 1024px) {
	.cse-col-left, .cse-col-right { grid-column: span 12; }
}
.cse-disc {
	background: #fff; border: 1px solid #e6e9f0; border-radius: 16px; padding: 22px 24px;
	box-shadow: 0 1px 2px rgba(16,26,51,0.04); display: flex; align-items: center; gap: 22px;
}
.cse-ring { position: relative; width: 64px; height: 64px; flex: none; }
.cse-ring-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #111a33; }
.cse-disc-name { font-size: 16px; font-weight: 700; color: #111a33; }
.cse-disc-meta { font-size: 13px; color: #5a6378; margin-top: 4px; }
.cse-link { font-size: 13px; font-weight: 700; color: #2f54d0; flex: none; white-space: nowrap; }
.cse-link:hover { text-decoration: underline; }
.cse-pill { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 8px; border-radius: 999px; }
.cse-pill--red { background: #fdecee; color: #c01f2f; }
.cse-pill--blue { background: #ebf0fe; color: #2746a8; }
.cse-pill--neutral { background: #eef0f6; color: #3a4565; }
.cse-alltime { background: #131c3f; border-radius: 16px; padding: 24px; color: #fff; }
.cse-alltime-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #6e7aa3; }
.cse-stat { font-family: var(--cse-font-display, 'Saira Condensed'), sans-serif; font-weight: 700; font-size: 36px; line-height: 1; }
.cse-stat-label { font-size: 12px; color: #a9b2d0; margin-top: 4px; }
.cse-miles { background: #fff; border: 1px solid #e6e9f0; border-radius: 16px; padding: 24px; box-shadow: 0 1px 2px rgba(16,26,51,0.04); }
.cse-miles-title { font-size: 17px; font-weight: 700; color: #111a33; }
.cse-mile-badge { width: 36px; height: 36px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex: none; }
.cse-mile-badge--on { background: #fdecee; color: #c01f2f; }
.cse-mile-badge--off { border: 1.5px dashed #c9cfdd; color: #97a0b5; }
.cse-mile-name { font-size: 13.5px; font-weight: 700; color: #111a33; }
.cse-mile-sub { font-size: 12px; color: #97a0b5; }
.cse-empty { border: 1px dashed #d7dce6; border-radius: 16px; padding: 48px 24px; text-align: center; }
.cse-empty-badge { width: 56px; height: 56px; border-radius: 999px; background: #fdecee; color: #c01f2f; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; }
.cse-empty-title { font-size: 16px; font-weight: 700; color: #111a33; }
.cse-empty-sub { font-size: 13.5px; color: #97a0b5; margin-top: 4px; }
.cse-cta { display: inline-block; margin-top: 16px; background: #db2b3a; color: #fff; font-size: 13px; font-weight: 700; padding: 9px 18px; border-radius: 10px; }
.cse-cta:hover { background: #c01f2f; }
</style>
