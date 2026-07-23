<template>
	<div
		v-if="course.title"
		class="cse-card flex flex-col h-full overflow-hidden text-ink-gray-9"
	>
		<!-- Thumbnail -->
		<div
			class="cse-thumb w-[100%] h-[150px] bg-cover bg-center bg-no-repeat"
			:style="
				course.image
					? { backgroundImage: `url('${encodeURI(course.image)}')` }
					: { backgroundImage: gradientColor, backgroundBlendMode: 'screen' }
			"
		>
			<div
				v-if="!course.image"
				class="flex items-center justify-center text-white flex-1 font-extrabold my-auto px-5 text-center leading-6 h-full"
				:class="
					course.title.length > 32
						? 'text-lg'
						: course.title.length > 20
						? 'text-xl'
						: 'text-2xl'
				"
			>
				{{ course.title }}
			</div>
		</div>

		<!-- Body -->
		<div class="flex flex-col flex-auto p-[18px]">
			<!-- Discipline pill -->
			<span v-if="firstTag" class="cse-pill" :class="`cse-pill--${disc.key}`">
				{{ firstTag }}
			</span>

			<!-- Title -->
			<div
				class="cse-title font-bold leading-snug mt-2.5"
				:class="course.title.length > 40 ? 'text-[15px]' : 'text-base'"
			>
				{{ course.title }}
			</div>

			<!-- Coach -->
			<div v-if="coachName" class="cse-coach text-[12.5px] mt-1">
				{{ coachName }}
			</div>

			<!-- Enrolled: progress + resume -->
			<template v-if="user && course.membership">
				<div class="flex items-center justify-between text-xs font-semibold mt-3.5 mb-2">
					<span class="cse-muted">
						{{ __('Lesson') }} {{ lessonsDone }} {{ __('of') }} {{ course.lessons || '—' }}
					</span>
					<span class="cse-pct">{{ Math.ceil(course.membership.progress) }}%</span>
				</div>
				<div class="cse-track">
					<div class="cse-fill" :style="{ width: `${course.membership.progress}%` }"></div>
				</div>
				<div class="cse-resume flex items-center gap-1.5 mt-3.5">
					<Play class="size-3 fill-current" />
					<span>{{ course.membership.progress >= 100 ? __('Review course') : __('Resume course') }}</span>
				</div>
			</template>

			<!-- Not enrolled: meta + price footer -->
			<div v-else class="flex items-center justify-between mt-auto pt-3.5">
				<div class="flex avatar-group overlap items-center">
					<div
						class="h-6 me-1"
						:class="{ 'avatar-group overlap': course.instructors.length > 1 }"
					>
						<UserAvatar v-for="instructor in course.instructors" :user="instructor" />
					</div>
					<CourseInstructors :instructors="course.instructors" />
				</div>
				<div class="flex items-center gap-x-2">
					<div v-if="course.lessons" class="cse-muted flex items-center text-[13px]">
						<BookOpen class="h-4 w-4 stroke-[1.5] me-1" />{{ course.lessons }}
					</div>
					<div v-if="course.rating" class="cse-muted flex items-center text-[13px]">
						<Star class="h-4 w-4 stroke-[1.5] me-1" />{{ formatRating(course.rating) }}
					</div>
					<div v-if="course.paid_course" class="font-bold text-ink-gray-9">
						{{ course.price }}
					</div>
					<Tooltip
						v-if="course.paid_certificate || course.enable_certification"
						:text="__('Get Certified')"
					>
						<GraduationCap class="size-5 stroke-[1.5] text-ink-gray-7" />
					</Tooltip>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import { Award, BookOpen, GraduationCap, Play, Star, Users } from 'lucide-vue-next'
import { sessionStore } from '@/stores/session'
import { Tooltip } from 'frappe-ui'
import { formatAmount, formatRating } from '@/utils'
import { theme } from '@/utils/theme'
import { computed } from 'vue'
import CourseInstructors from '@/components/CourseInstructors.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import colors from '@/utils/frappe-ui-colors.json'

const { user } = sessionStore()

const props = defineProps({
	course: {
		type: Object,
		default: null,
	},
})

const gradientColor = computed(() => {
	let themeMode = theme.value === 'dark' ? 'darkMode' : 'lightMode'
	let color = props.course.card_gradient?.toLowerCase() || 'blue'
	let colorMap = colors[themeMode][color]
	return `linear-gradient(to top right, black, ${colorMap[400]})`
})

const firstTag = computed(() =>
	props.course.tags ? props.course.tags.split(',')[0].trim() : null
)

// Map a discipline tag to a brand-consistent pill tint (Batch 3 tokens).
const disc = computed(() => {
	const t = (firstTag.value || '').toLowerCase()
	if (/box|kick|strik|muay|thai/.test(t)) return { key: 'red' }
	if (/bjj|jiu|jitsu|grappl|guard|gi\b/.test(t)) return { key: 'blue' }
	return { key: 'neutral' }
})

const coachName = computed(() => {
	const i = props.course.instructors && props.course.instructors[0]
	return i ? i.full_name || i.first_name || i.name : null
})

const lessonsDone = computed(() => {
	if (!props.course.membership || !props.course.lessons) return 0
	return Math.round((props.course.membership.progress / 100) * props.course.lessons)
})
</script>
<style scoped>
.cse-card {
	background: #ffffff;
	border: 1px solid #e6e9f0;
	border-radius: 16px;
	box-shadow: 0 1px 2px rgba(16, 26, 51, 0.04);
	transition: box-shadow 0.18s ease, transform 0.18s ease;
	min-height: 0;
}
.cse-card:hover {
	box-shadow: 0 10px 24px rgba(16, 26, 51, 0.1);
	transform: translateY(-2px);
}
.cse-thumb {
	border-radius: 16px 16px 0 0;
}
.cse-title {
	color: #111a33;
	letter-spacing: -0.01em;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
.cse-coach {
	color: #5a6378;
}
.cse-muted {
	color: #5a6378;
}
.cse-pct {
	color: #db2b3a;
	font-weight: 700;
}
.cse-track {
	height: 6px;
	border-radius: 999px;
	background: #eef0f5;
	overflow: hidden;
}
.cse-fill {
	height: 100%;
	border-radius: 999px;
	background: #db2b3a;
}
.cse-resume {
	font-size: 13px;
	font-weight: 700;
	color: #db2b3a;
}
.cse-pill {
	align-self: flex-start;
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.1em;
	text-transform: uppercase;
	padding: 4px 8px;
	border-radius: 999px;
}
.cse-pill--red {
	background: #fdecee;
	color: #c01f2f;
}
.cse-pill--blue {
	background: #ebf0fe;
	color: #2746a8;
}
.cse-pill--neutral {
	background: #eef0f6;
	color: #3a4565;
}
</style>
