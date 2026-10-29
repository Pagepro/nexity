import { lazy } from "react";

const IconApply = lazy(() => import("@/assets/icons/utility/icon-apply.svg"));
const IconCalendar = lazy(() => import("@/assets/icons/utility/icon-calendar.svg"));
const IconEnquiry = lazy(() => import("@/assets/icons/utility/icon-enquiry.svg"));
const IconSearch = lazy(() => import("@/assets/icons/utility/icon-search.svg"));
const IconTime = lazy(() => import("@/assets/icons/utility/icon-time.svg"));
const IconVisit = lazy(() => import("@/assets/icons/utility/icon-visit.svg"));
const IconError = lazy(() => import("@/assets/icons/utility/icon-error.svg"));
const IconChevronRight = lazy(
  () => import("@/assets/icons/utility/icon-chevron-right.svg"),
);
const IconCheck = lazy(() => import("@/assets/icons/utility/icon-check.svg"));
const IconArrow = lazy(() => import("@/assets/icons/utility/icon-arrow.svg"));
const IconDownload = lazy(() => import("@/assets/icons/utility/icon-download.svg"));
const IconClose = lazy(() => import("@/assets/icons/utility/icon-close.svg"));
const IconArrowLong = lazy(() => import("@/assets/icons/utility/icon-arrow-long.svg"));

const utilityIconsMap = {
  "utility-apply": IconApply,
  "utility-calendar": IconCalendar,
  "utility-download": IconDownload,
  "utility-enquiry": IconEnquiry,
  "utility-search": IconSearch,
  "utility-time": IconTime,
  "utility-visit": IconVisit,
  "utility-error": IconError,
  "utility-chevron-right": IconChevronRight,
  "utility-check": IconCheck,
  "utility-arrow": IconArrow,
  "utility-close": IconClose,
  "utility-arrow-long": IconArrowLong,
} as const;

export default utilityIconsMap;
