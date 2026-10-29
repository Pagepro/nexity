"use client";

import dynamic from "next/dynamic";

const PodcastListingClient = dynamic(() => import("./client"));

export default PodcastListingClient;
