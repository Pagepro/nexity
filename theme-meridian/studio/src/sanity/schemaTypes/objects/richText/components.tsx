import React from "react";

export const Strong = (props: { children: React.ReactNode }) => (
  <span className="font-bold">{props.children}</span>
);

export const Medium = (props: { children: React.ReactNode }) => (
  <strong className="font-medium">{props.children}</strong>
);

export const Light = (props: { children: React.ReactNode }) => (
  <span style={{ fontWeight: 300 }}>{props.children}</span>
);

export const Superscript = (props: { children: React.ReactNode }) => (
  <sup>{props.children}</sup>
);

export const Subscript = (props: { children: React.ReactNode }) => (
  <sub>{props.children}</sub>
);

const TextAlign = (props: {
  children: React.ReactNode;
  align: "left" | "center" | "right";
}) => <p style={{ margin: 0, textAlign: props.align }}>{props.children}</p>;

export const TextAlignLeft = (props: { children: React.ReactNode }) => (
  <TextAlign align="left">{props.children}</TextAlign>
);

export const TextAlignCenter = (props: { children: React.ReactNode }) => (
  <TextAlign align="center">{props.children}</TextAlign>
);

export const TextAlignRight = (props: { children: React.ReactNode }) => (
  <TextAlign align="right">{props.children}</TextAlign>
);
