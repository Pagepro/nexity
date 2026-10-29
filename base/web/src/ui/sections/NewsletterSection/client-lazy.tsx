"use client";

import dynamic from "next/dynamic";

const NewsletterForm = dynamic(() => import("./client"));

export default NewsletterForm;
