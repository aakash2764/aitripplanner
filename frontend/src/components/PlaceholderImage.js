import React from 'react';
import { Box, Typography } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';

const PlaceholderImage = ({ height = 240, width = '100%', description = 'Image not available' }) => {
  return (
    <Box
      sx={{
        height,
        width,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        color: '#9e9e9e',
        borderRadius: 1,
        border: '1px dashed #ccc',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ImageIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
      <Typography 
        variant="body2" 
        sx={{ 
          textAlign: 'center',
          px: 2,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {description}
      </Typography>
    </Box>
  );
};

export default PlaceholderImage; 