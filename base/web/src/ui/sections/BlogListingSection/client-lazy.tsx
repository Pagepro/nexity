"use client";

import dynamic from "next/dynamic";

const BlogListingClient = dynamic(() => import("./client"));

export default BlogListingClient;
