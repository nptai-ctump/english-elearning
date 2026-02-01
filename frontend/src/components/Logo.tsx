import { Box } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";

export default function Logo() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <SchoolIcon fontSize="large" />
      <Box sx={{ fontWeight: 800, letterSpacing: 0.5 }}>ENGLISH LMS</Box>
    </Box>
  );
}
