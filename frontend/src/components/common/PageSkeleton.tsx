import {
  Box,
  Card,
  CardContent,
  Container,
  Skeleton,
  useTheme,
} from "@mui/material";

interface PageSkeletonProps {
  variant?: "dashboard" | "project-board" | "analytics" | "default";
}

export const PageSkeleton = ({ variant = "default" }: PageSkeletonProps) => {
  const theme = useTheme();

  const renderDashboardSkeleton = () => (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Skeleton
          variant="text"
          width="200px"
          height={40}
          sx={{ mb: 2, borderRadius: 2 }}
        />
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Skeleton
            variant="rectangular"
            width={300}
            height={40}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton
            variant="rectangular"
            width={120}
            height={40}
            sx={{ borderRadius: 2 }}
          />
        </Box>
      </Box>

      {/* Analytics Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 3,
          mb: 4,
        }}
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Skeleton
                  variant="circular"
                  width={24}
                  height={24}
                  sx={{ mr: 1 }}
                />
                <Skeleton
                  variant="text"
                  width="60%"
                  height={20}
                  sx={{ borderRadius: 1 }}
                />
              </Box>
              <Skeleton
                variant="text"
                width="40%"
                height={32}
                sx={{ mb: 1, borderRadius: 1 }}
              />
              <Skeleton
                variant="text"
                width="80%"
                height={16}
                sx={{ borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Projects Grid - Updated to match ProjectList mobile design */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)", // 2 columns on mobile like ProjectList
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
            xl: "repeat(5, 1fr)",
          },
          gap: { xs: 1, sm: 2 }, // Responsive gap like ProjectList
        }}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <Card
            key={index}
            sx={{
              height: "100%",
              borderRadius: 2,
              position: "relative",
              overflow: "hidden",
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${theme.palette.divider}`,
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}80, ${theme.palette.secondary.main}80)`,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Centered emoji area */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 2,
                }}
              >
                <Skeleton
                  variant="circular"
                  width={48}
                  height={48}
                  sx={{ borderRadius: 2 }}
                />
                <Skeleton
                  variant="text"
                  width="80%"
                  height={24}
                  sx={{ borderRadius: 1 }}
                />
              </Box>

              {/* Add button */}
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Skeleton
                  variant="rounded"
                  width="100%"
                  height={40}
                  sx={{ borderRadius: 3 }}
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );

  const renderProjectBoardSkeleton = () => (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Skeleton
            variant="rectangular"
            width={80}
            height={32}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton
            variant="rectangular"
            width={100}
            height={32}
            sx={{ borderRadius: 2 }}
          />
        </Box>
        <Skeleton
          variant="text"
          width="40%"
          height={32}
          sx={{ borderRadius: 1 }}
        />
        <Skeleton
          variant="text"
          width="60%"
          height={16}
          sx={{ borderRadius: 1 }}
        />
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Skeleton
            variant="rectangular"
            width={200}
            height={40}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton
            variant="rectangular"
            width={120}
            height={40}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton
            variant="rectangular"
            width={100}
            height={40}
            sx={{ borderRadius: 2 }}
          />
        </Box>
      </Box>

      {/* Board Content */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3, 1fr)",
          },
          gap: 2,
          flex: 1,
        }}
      >
        {Array.from({ length: 3 }).map((_, columnIndex) => (
          <Box key={columnIndex}>
            <Skeleton
              variant="text"
              width="80%"
              height={24}
              sx={{ mb: 2, borderRadius: 1 }}
            />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {Array.from({ length: 3 }).map((_, cardIndex) => (
                <Card key={cardIndex} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Skeleton
                      variant="text"
                      width="90%"
                      height={20}
                      sx={{ mb: 1, borderRadius: 1 }}
                    />
                    <Skeleton
                      variant="text"
                      width="100%"
                      height={16}
                      sx={{ mb: 1, borderRadius: 1 }}
                    />
                    <Skeleton
                      variant="text"
                      width="70%"
                      height={16}
                      sx={{ borderRadius: 1 }}
                    />
                    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                      <Skeleton
                        variant="rectangular"
                        width={60}
                        height={20}
                        sx={{ borderRadius: 1 }}
                      />
                      <Skeleton
                        variant="rectangular"
                        width={50}
                        height={20}
                        sx={{ borderRadius: 1 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const renderAnalyticsSkeleton = () => (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Skeleton
          variant="text"
          width="300px"
          height={40}
          sx={{ borderRadius: 1 }}
        />
        <Skeleton
          variant="rectangular"
          width={200}
          height={40}
          sx={{ borderRadius: 2 }}
        />
      </Box>

      {/* Metrics Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 3,
          mb: 4,
        }}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Skeleton
                  variant="circular"
                  width={24}
                  height={24}
                  sx={{ mr: 1 }}
                />
                <Skeleton
                  variant="text"
                  width="60%"
                  height={20}
                  sx={{ borderRadius: 1 }}
                />
              </Box>
              <Skeleton
                variant="text"
                width="40%"
                height={32}
                sx={{ mb: 1, borderRadius: 1 }}
              />
              <Skeleton
                variant="text"
                width="80%"
                height={16}
                sx={{ mb: 1, borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                width="30%"
                height={24}
                sx={{ borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Charts */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, 1fr)",
          },
          gap: 3,
        }}
      >
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Skeleton
              variant="text"
              width="40%"
              height={24}
              sx={{ mb: 2, borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              height={300}
              sx={{ borderRadius: 2 }}
            />
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Skeleton
              variant="text"
              width="40%"
              height={24}
              sx={{ mb: 2, borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              height={300}
              sx={{ borderRadius: 2 }}
            />
          </CardContent>
        </Card>
      </Box>
    </Container>
  );

  const renderDefaultSkeleton = () => (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Skeleton
        variant="text"
        width="300px"
        height={40}
        sx={{ mb: 3, borderRadius: 1 }}
      />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            height={60}
            sx={{ borderRadius: 2 }}
          />
        ))}
      </Box>
    </Container>
  );

  switch (variant) {
    case "dashboard":
      return renderDashboardSkeleton();
    case "project-board":
      return renderProjectBoardSkeleton();
    case "analytics":
      return renderAnalyticsSkeleton();
    default:
      return renderDefaultSkeleton();
  }
};
