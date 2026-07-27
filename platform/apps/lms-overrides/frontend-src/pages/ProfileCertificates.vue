<template>
	<div class="mt-7 mb-10">
		<div class="flex items-center gap-3 mb-1">
			<div class="cse-hbar"></div>
			<h2 class="cse-h2">{{ __('Certificates') }}</h2>
		</div>
		<div class="cse-sub mb-5">
			{{ __('Earned by finishing a course — verified and shareable.') }}
		</div>

		<div
			v-if="certificates.data?.length"
			class="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[980px]"
		>
			<div
				v-for="certificate in certificates.data"
				:key="certificate.name"
				class="cse-cert"
			>
				<div class="cse-cert-head">
					<div class="cse-cert-tab"></div>
					<div class="cse-cert-eyebrow">{{ __('Certificate of completion') }}</div>
					<div class="cse-cert-title">
						{{ certificate.course_title || certificate.batch_title }}
					</div>
					<div class="cse-cert-award">
						{{ __('Awarded to') }} {{ awardedTo }} ·
						{{ dayjs(certificate.issue_date).format('MMM D, YYYY') }}
					</div>
				</div>
				<div class="cse-cert-foot">
					<span class="cse-cert-issued">
						{{ __('Issued') }} {{ dayjs(certificate.issue_date).format('DD MMM YYYY') }}
					</span>
					<div class="ml-auto flex gap-2">
						<button class="cse-btn cse-btn--outline" @click="openCertificate(certificate)">
							<Download class="size-3.5 stroke-2" />
							<span>{{ __('PDF') }}</span>
						</button>
						<button class="cse-btn cse-btn--ghost" @click="shareCertificate(certificate)">
							<Share2 class="size-3.5 stroke-2" />
							<span>{{ __('Share') }}</span>
						</button>
					</div>
				</div>
			</div>
		</div>

		<div v-else-if="!certificates.list?.loading" class="cse-empty">
			<div class="cse-empty-badge">
				<Award class="size-6 stroke-[1.75]" />
			</div>
			<div class="cse-empty-title">{{ __('No certificates yet') }}</div>
			<div class="cse-empty-sub">
				{{ __('Finish a course to earn your first verified certificate.') }}
			</div>
		</div>
	</div>
</template>
<script setup>
import { createListResource } from 'frappe-ui'
import { Award, Download, Share2 } from 'lucide-vue-next'
import { computed, inject, onMounted } from 'vue'

const dayjs = inject('$dayjs')
const props = defineProps({
	profile: {
		type: Object,
		required: true,
	},
})

const awardedTo = computed(
	() => props.profile.data?.full_name || props.profile.data?.name || ''
)

onMounted(() => {
	if (props.profile.data?.name) {
		certificates.reload()
	}
})

const certificates = createListResource({
	doctype: 'LMS Certificate',
	filters: {
		member: props.profile.data?.name,
	},
	fields: ['name', 'course_title', 'batch_title', 'issue_date', 'template'],
	cache: ['certificates', props.profile.data?.name],
})

const openCertificate = (certificate) => {
	window.open(
		`/api/method/frappe.utils.print_format.download_pdf?doctype=LMS+Certificate&name=${
			certificate.name
		}&format=${encodeURIComponent(certificate.template)}`
	)
}

const shareCertificate = async (certificate) => {
	const title = certificate.course_title || certificate.batch_title
	const url = `${window.location.origin}/api/method/frappe.utils.print_format.download_pdf?doctype=LMS+Certificate&name=${certificate.name}&format=${encodeURIComponent(certificate.template)}`
	try {
		if (navigator.share) {
			await navigator.share({ title: `${title} — Certificate`, url })
		} else {
			await navigator.clipboard.writeText(url)
		}
	} catch (e) {
		/* user cancelled share — no-op */
	}
}
</script>
<style scoped>
.cse-hbar {
	width: 4px;
	height: 26px;
	background: #db2b3a;
	border-radius: 2px;
}
.cse-h2 {
	font-family: var(--cse-font-display, 'Saira Condensed'), sans-serif;
	font-weight: 700;
	font-size: 26px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: #131c3f;
}
.cse-sub {
	font-size: 14px;
	color: #5a6378;
	margin-left: 18px;
}
.cse-cert {
	background: #ffffff;
	border: 1px solid #e6e9f0;
	border-radius: 16px;
	overflow: hidden;
	box-shadow: 0 1px 2px rgba(16, 26, 51, 0.04);
}
.cse-cert-head {
	background: #131c3f;
	padding: 28px 28px 24px;
	position: relative;
}
.cse-cert-tab {
	position: absolute;
	top: 0;
	left: 28px;
	width: 44px;
	height: 4px;
	background: #db2b3a;
	border-radius: 0 0 3px 3px;
}
.cse-cert-eyebrow {
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.16em;
	text-transform: uppercase;
	color: #6e7aa3;
}
.cse-cert-title {
	font-family: var(--cse-font-display, 'Saira Condensed'), sans-serif;
	font-weight: 700;
	font-size: 26px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: #ffffff;
	margin-top: 10px;
	line-height: 1.15;
}
.cse-cert-award {
	font-size: 12.5px;
	color: #a9b2d0;
	margin-top: 8px;
}
.cse-cert-foot {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 16px 20px;
}
.cse-cert-issued {
	font-size: 12px;
	color: #97a0b5;
	font-weight: 600;
}
.cse-btn {
	font-family: var(--cse-font-app, 'Plus Jakarta Sans'), sans-serif;
	border-radius: 9px;
	padding: 8px 14px;
	font-size: 13px;
	font-weight: 700;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 7px;
	color: #131c3f;
}
.cse-btn--outline {
	background: #ffffff;
	border: 1px solid #d7dce6;
}
.cse-btn--outline:hover {
	background: #f6f7f9;
}
.cse-btn--ghost {
	background: transparent;
	border: none;
}
.cse-btn--ghost:hover {
	background: #f1f3f7;
}
.cse-empty {
	border: 1px dashed #d7dce6;
	border-radius: 16px;
	padding: 48px 24px;
	text-align: center;
	max-width: 560px;
}
.cse-empty-badge {
	width: 56px;
	height: 56px;
	border-radius: 999px;
	background: #fdecee;
	color: #c01f2f;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 14px;
}
.cse-empty-title {
	font-size: 16px;
	font-weight: 700;
	color: #111a33;
}
.cse-empty-sub {
	font-size: 13.5px;
	color: #97a0b5;
	margin-top: 4px;
}
</style>
