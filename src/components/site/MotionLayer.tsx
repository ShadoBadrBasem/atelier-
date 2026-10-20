"use client";
import dynamic from "next/dynamic";
const Choreography = dynamic(() => import("./ScrollChoreography"), { ssr: false });
export function MotionLayer() { return <Choreography />; }
