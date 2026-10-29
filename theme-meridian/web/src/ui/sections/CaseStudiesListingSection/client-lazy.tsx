"use client";

import dynamic from "next/dynamic";

const CaseStudiesListingClient = dynamic(() => import("./client"));

export default CaseStudiesListingClient;
