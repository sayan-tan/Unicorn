'use client';

import React from 'react';
import { Typography } from '@mui/material';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import styles from './TestDocCard.module.css';

export interface TestDocCardProps {
  onGenerate?: () => void;
}

export default function TestDocCard({ onGenerate }: TestDocCardProps) {
  return (
    <div className={styles.card} role="region" aria-label="Generate test documentation">
      <div className={styles.iconWrap}>
        <ArticleOutlinedIcon aria-hidden />
      </div>
      <Typography variant="h4" component="h2" className={styles.title}>
        Generate Test
        <br />
        Documentation
      </Typography>
      <Typography variant="body2" component="p" className={styles.description}>
        Produces structured test documentation from your code or existing tests so teams can review coverage and
        scenarios in one place.
      </Typography>
      <button type="button" className={styles.generate} onClick={() => onGenerate?.()}>
        Generate
      </button>
    </div>
  );
}
