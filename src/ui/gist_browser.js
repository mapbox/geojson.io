// gists
query { 
  viewer {
    gists(first:100) {
      totalCount,
      nodes {
        name,
        id,
        isPublic,
        description,
        createdAt
      }
    }
  }
}

// organizations
query { 
  viewer {
    organizations(first:100) {
      totalCount,
      nodes {
        avatarUrl,
        name,
        id
      }
    }
  }
}
