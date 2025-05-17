import React from 'react';
import Image from 'next/image';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, SAVING_CATEGORIES } from '../utils/constants';
interface IconProps {
  className?: string;
  size?: number;
}

export const getIcon = (name: string, props: IconProps = {}): JSX.Element => {
  const { className = '', size = 24 } = props;

  return (
    <Image 
      src={`/icons/${name}.svg`}
      alt={`${name} icon`}
      className={className}
      width={size}
      height={size}
      priority
    />
  );
};

// Navigation icons
export const getNavIcon = (name: string, props: IconProps = {}): JSX.Element => {
  return getIcon(name, { ...props, className: `h-5 w-5 ${props.className || ''}` });
};

// Transaction category icons
export const getTransactionIcon = (categoryName: string, props: IconProps = {}): JSX.Element => {

  const allCategories = [
    ...Object.values(EXPENSE_CATEGORIES),
    ...Object.values(SAVING_CATEGORIES),
    ...Object.values(INCOME_CATEGORIES),
  ];
  const category = allCategories.find(cat => cat.name === categoryName);

  if (category) {
    return getIcon(category.icon, { ...props, className: `h-5 w-5 ${props.className || ''}` });
  }

  return getIcon('other', { ...props, className: `h-5 w-5 ${props.className || ''}` });
};

// Notification icons
export const getNotificationIcon = (type: string, props: IconProps = {}): JSX.Element => {
  const iconMap: { [key: string]: string } = {
    'SUCCESS': 'success',
    'WARNING': 'warning',
    'ERROR': 'error',
    'INFO': 'info'
  };

  const iconName = iconMap[type] || 'info';
  return getIcon(iconName, { ...props, className: `h-5 w-5 ${props.className || ''}` });
}; 