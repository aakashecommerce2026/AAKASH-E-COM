import React from "react";
import {
  Box,
  TextField,
  MenuItem,
  Button,
  ButtonGroup,
  Stack,
  InputAdornment,
  Tooltip,
  Paper,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableViewIcon from "@mui/icons-material/TableView";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

const QueryFilterExportBar = ({
  searchQuery,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  typeFilter,
  onTypeFilterChange,
  typeOptions = [],
  typeLabel = "Filter Type",
  onPresetChange,
  onExportPDF,
  onExportExcel,
  onReset,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        bgcolor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 3,
      }}
    >
      <Stack spacing={2}>
        {/* Top Controls Row */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Search Input */}
          <TextField
            size="small"
            value={searchQuery || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search network records..."
            sx={{
              minWidth: { xs: "100%", sm: 220 },
              flexGrow: 1,
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />

          {/* Type Dropdown Filter */}
          {typeOptions.length > 0 && (
            <TextField
              select
              size="small"
              label={typeLabel}
              value={typeFilter || "ALL"}
              onChange={(e) => onTypeFilterChange(e.target.value)}
              sx={{
                minWidth: { xs: "100%", sm: 160 },
                width: { xs: "100%", sm: "auto" },
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterAltIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            >
              <MenuItem value="ALL">All Categories</MenuItem>
              {typeOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* From Date Picker */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, width: { xs: "100%", sm: "auto" } }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "#475569", fontSize: "0.75rem" }}>
              From Date
            </Typography>
            <TextField
              type="date"
              size="small"
              value={startDate || ""}
              onChange={(e) => onStartDateChange(e.target.value)}
              sx={{
                minWidth: { xs: "100%", sm: 150 },
                width: { xs: "100%", sm: "auto" },
                "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FFFFFF" },
                "& .MuiInputBase-input": {
                  py: "6px",
                  fontSize: "0.85rem",
                  color: "#1E293B",
                },
              }}
            />
          </Box>

          {/* To Date Picker */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, width: { xs: "100%", sm: "auto" } }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "#475569", fontSize: "0.75rem" }}>
              To Date
            </Typography>
            <TextField
              type="date"
              size="small"
              value={endDate || ""}
              onChange={(e) => onEndDateChange(e.target.value)}
              sx={{
                minWidth: { xs: "100%", sm: 150 },
                width: { xs: "100%", sm: "auto" },
                "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FFFFFF" },
                "& .MuiInputBase-input": {
                  py: "6px",
                  fontSize: "0.85rem",
                  color: "#1E293B",
                },
              }}
            />
          </Box>
        </Box>

        {/* Bottom Presets and Export Triggers Row */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
            justifyContent: "space-between",
            pt: 1,
            borderTop: "1px solid #F1F5F9",
          }}
        >
          {/* Quick Date Presets */}
          <ButtonGroup size="small" variant="outlined" color="inherit">
            <Button onClick={() => onPresetChange && onPresetChange("ALL")}>
              All Time
            </Button>
            <Button onClick={() => onPresetChange && onPresetChange("TODAY")}>
              Today
            </Button>
            <Button
              onClick={() => onPresetChange && onPresetChange("THIS_MONTH")}
            >
              This Month
            </Button>
            <Button onClick={() => onPresetChange && onPresetChange("LAST_30")}>
              Last 30 Days
            </Button>
          </ButtonGroup>

          {/* Action Triggers & Reset */}
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            {onReset && (
              <Tooltip title="Reset all query filters">
                <Button
                  size="small"
                  variant="text"
                  color="inherit"
                  startIcon={<RestartAltIcon />}
                  onClick={onReset}
                  sx={{ color: "text.secondary" }}
                >
                  Reset
                </Button>
              </Tooltip>
            )}

            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<PictureAsPdfIcon />}
              onClick={onExportPDF}
              sx={{ fontWeight: 600 }}
            >
              Export PDF
            </Button>

            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<TableViewIcon />}
              onClick={onExportExcel}
              sx={{ fontWeight: 600 }}
            >
              Export Excel
            </Button>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
};

export default QueryFilterExportBar;
