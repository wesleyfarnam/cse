<template>
	<div class="flex min-h-0 flex-1 flex-col p-5 pb-10">
		<div v-if="dash.data">
			<!-- Greeting -->
			<div class="mb-6">
				<div class="cse-hi">
					{{ __('Welcome back') }}{{ dash.data.first_name ? ', ' + dash.data.first_name : '' }}
				</div>
				<div class="cse-hi-sub">{{ greetingSub }}</div>
			</div>

			<div class="cse-grid">
				<!-- Continue training -->
				<div class="cse-col8">
					<div v-if="ct" class="cse-continue">
						<div class="cse-ct-thumb" :style="thumbStyle(ct.image, ct.disc_key)">
							<router-link :to="courseRoute(ct.course)" class="cse-ct-play">
								<Play class="size-[18px] fill-current" />
							</router-link>
						</div>
						<div class="flex-1 min-w-0 flex flex-col">
							<div class="cse-ct-eyebrow">{{ __('Continue training') }}</div>
							<div class="cse-ct-title">{{ ct.title }}</div>
							<div class="cse-ct-meta">
								<span v-if="ct.coach">{{ ct.coach }}</span>
							</div>
							<div class="mt-auto">
								<div class="flex justify-between text-xs font-semibold mb-2" style="color:#5A6378;">
									<span>{{ __('Lesson') }} {{ ct.lessons_done }} {{ __('of') }} {{ ct.lessons_total }}</span>
									<span style="color:#DB2B3A;font-weight:700;">{{ ct.progress }}%</span>
								</div>
								<div class="cse-track"><div class="cse-fill" :style="{ width: ct.progress + '%' }"></div></div>
								<div class="flex gap-3 mt-4">
									<router-link :to="courseRoute(ct.course)" class="cse-btn-primary">
										<Play class="size-3.5 fill-current" />
										<span>{{ __('Resume lesson') }}</span>
									</router-link>
									<router-link :to="courseRoute(ct.course)" class="cse-btn-outline">{{ __('View course') }}</router-link>
								</div>
							</div>
						</div>
					</div>
					<div v-else class="cse-continue cse-continue--empty">
						<div>
							<div class="cse-ct-eyebrow">{{ __('Get started') }}</div>
							<div class="cse-ct-title">{{ __('Start your first course') }}</div>
							<div class="cse-ct-meta">{{ __('Enroll to begin tracking your training here.') }}</div>
							<router-link :to="{ name: 'Courses' }" class="cse-btn-primary mt-4" style="width:fit-content;">
								{{ __('Browse courses') }}
							</router-link>
						</div>
					</div>
				</div>

				<!-- This week -->
				<div class="cse-col4">
					<div class="cse-week">
						<div class="flex items-center justify-between">
							<div style="font-size:17px;font-weight:700;color:#111A33;">{{ __('This week') }}</div>
							<span class="cse-streak-pill">{{ dash.data.streak }}-{{ __('day streak') }}</span>
						</div>
						<div class="flex justify-between mt-4">
							<div v-for="(d, i) in dash.data.week" :key="i" class="flex flex-col items-center gap-1.5">
								<div class="cse-dot" :class="d.done ? 'cse-dot--on' : 'cse-dot--off'">
									<Check v-if="d.done" class="size-3 stroke-[3]" />
								</div>
								<span class="cse-dot-label">{{ d.label }}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Recommended -->
			<div v-if="dash.data.recommended?.length" class="mt-7">
				<div class="cse-rec-title">{{ __('Recommended for you') }}</div>
				<div class="cse-rec-grid mt-4">
					<router-link
						v-for="r in dash.data.recommended"
						:key="r.name"
						:to="courseRoute(r.name)"
						class="cse-rec"
					>
						<div class="cse-rec-thumb" :style="thumbStyle(r.image, r.disc_key)"></div>
						<div class="p-4">
							<span v-if="r.discipline" class="cse-pill" :class="`cse-pill--${r.disc_key}`">{{ r.discipline }}</span>
							<div class="cse-rec-name" :class="r.discipline ? 'mt-2.5' : ''">{{ r.title }}</div>
							<div v-if="r.coach" class="cse-rec-coach">{{ r.coach }}</div>
						</div>
					</router-link>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import { createResource, usePageMeta } from 'frappe-ui'
import { Check, Play } from 'lucide-vue-next'
import { computed } from 'vue'
import { sessionStore } from '@/stores/session'

const { brand } = sessionStore()

const dash = createResource({
	url: 'cse_branding.progress.student_dashboard',
	auto: true,
})

const ct = computed(() => dash.data?.continue_training)

const greetingSub = computed(() => {
	const c = ct.value
	if (c && c.remaining > 0) return `You're ${c.remaining} ${c.remaining === 1 ? 'lesson' : 'lessons'} from finishing ${c.title}.`
	if (c) return `Keep your training going.`
	return `Pick a course and start training.`
})

const courseRoute = (name) => ({ name: 'CourseDetail', params: { courseName: name } })

const gradients = {
	red: 'linear-gradient(135deg,#222F63 0%,#10193C 100%)',
	blue: 'linear-gradient(135deg,#1B2752 0%,#0F1735 100%)',
	neutral: 'linear-gradient(135deg,#26335F 0%,#131C3F 100%)',
}
const thumbStyle = (image, key) =>
	image
		? { backgroundImage: `url('${encodeURI(image)}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
		: { backgroundImage: gradients[key] || gradients.neutral }

usePageMeta(() => ({ title: __('Dashboard'), icon: brand?.favicon }))
</script>
<style scoped>
.cse-hi { font-size: 26px; font-weight: 800; letter-spacing: -0.01em; color: #111a33; }
.cse-hi-sub { font-size: 14px; color: #5a6378; margin-top: 4px; }
.cse-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; align-items: stretch; }
.cse-col8 { grid-column: span 8; }
.cse-col4 { grid-column: span 4; }
@media (max-width: 1024px) { .cse-col8, .cse-col4 { grid-column: span 12; } }
.cse-continue {
	background: #fff; border: 1px solid #e6e9f0; border-radius: 16px; padding: 24px; height: 100%;
	display: flex; gap: 24px; box-shadow: 0 1px 2px rgba(16,26,51,0.04);
}
.cse-continue--empty { align-items: center; }
.cse-ct-thumb {
	width: 300px; height: 188px; flex: none; border-radius: 12px; position: relative;
	display: flex; align-items: center; justify-content: center;
}
@media (max-width: 1180px) { .cse-ct-thumb { width: 200px; } }
.cse-ct-play {
	width: 52px; height: 52px; border-radius: 999px; background: rgba(255,255,255,0.16);
	border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; color: #fff;
}
.cse-ct-play:hover { background: rgba(255,255,255,0.28); }
.cse-ct-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #db2b3a; }
.cse-ct-title { font-size: 22px; font-weight: 700; color: #111a33; margin-top: 8px; }
.cse-ct-meta { font-size: 14px; color: #5a6378; margin-top: 4px; }
.cse-track { height: 8px; border-radius: 999px; background: #eef0f5; overflow: hidden; }
.cse-fill { height: 100%; border-radius: 999px; background: #db2b3a; }
.cse-btn-primary {
	background: #db2b3a; color: #fff; border-radius: 10px; padding: 11px 20px; font-size: 14px; font-weight: 700;
	display: inline-flex; align-items: center; gap: 8px;
}
.cse-btn-primary:hover { background: #c01f2f; }
.cse-btn-outline {
	background: #fff; color: #131c3f; border: 1px solid #d7dce6; border-radius: 10px; padding: 11px 20px;
	font-size: 14px; font-weight: 700; display: inline-flex; align-items: center;
}
.cse-btn-outline:hover { background: #f6f7f9; }
.cse-week {
	background: #fff; border: 1px solid #e6e9f0; border-radius: 16px; padding: 24px; height: 100%;
	box-shadow: 0 1px 2px rgba(16,26,51,0.04);
}
.cse-streak-pill {
	font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
	background: #fdecee; color: #c01f2f; padding: 5px 10px; border-radius: 999px;
}
.cse-dot { width: 30px; height: 30px; border-radius: 999px; display: flex; align-items: center; justify-content: center; color: #fff; }
.cse-dot--on { background: #db2b3a; }
.cse-dot--off { border: 1.5px dashed #c9cfdd; }
.cse-dot-label { font-size: 11px; color: #97a0b5; font-weight: 600; }
.cse-rec-title { font-size: 17px; font-weight: 700; color: #111a33; }
.cse-rec-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
@media (max-width: 1024px) { .cse-rec-grid { grid-template-columns: repeat(1, 1fr); } }
.cse-rec {
	display: block; background: #fff; border: 1px solid #e6e9f0; border-radius: 16px; overflow: hidden;
	box-shadow: 0 1px 2px rgba(16,26,51,0.04); transition: box-shadow .18s ease, transform .18s ease;
}
.cse-rec:hover { box-shadow: 0 10px 24px rgba(16,26,51,0.1); transform: translateY(-2px); }
.cse-rec-thumb { height: 140px; }
.cse-rec-name { font-size: 16px; font-weight: 700; color: #111a33; letter-spacing: -0.01em; line-height: 1.35; }
.cse-rec-coach { font-size: 12.5px; color: #5a6378; margin-top: 4px; }
.cse-pill { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 8px; border-radius: 999px; }
.cse-pill--red { background: #fdecee; color: #c01f2f; }
.cse-pill--blue { background: #ebf0fe; color: #2746a8; }
.cse-pill--neutral { background: #eef0f6; color: #3a4565; }
</style>
