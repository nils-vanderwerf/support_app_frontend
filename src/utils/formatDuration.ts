export const formatDuration = (minutes: number):string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if ( hours > 0 && remainingMinutes > 0 ) 
    return ( `${hours}hr ${remainingMinutes} min` )
   if ( hours === 0 && remainingMinutes > 0 ) 
     return ( `${remainingMinutes} min` )
  if ( hours > 0 && remainingMinutes === 0 ) 
     return ( `${hours} hr` )
  else 
    return ( '0 min')
}